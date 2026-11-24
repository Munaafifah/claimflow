package com.claimflow;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:workflow",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class ClaimWorkflowTest {
    private static final String ACTOR = "X-Demo-User-Id";
    private static final String CLAIM = """
            {"type":"MOTOR","market":"MY","incidentDate":"2025-01-01",
             "description":"Demo incident","requestedAmount":"120.50","currency":"MYR"}
            """;

    @Autowired
    private MockMvc mvc;

    @Test
    void claimantAndOfficerCompleteTheInformationAndSettlementWorkflow() throws Exception {
        String claim = submit();
        mvc.perform(get(claim).header(ACTOR, "claimant-2")).andExpect(status().isNotFound());
        mvc.perform(get("/api/claims").header(ACTOR, "claimant-2")).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/claims").param("status", "SUBMITTED").header(ACTOR, "officer-1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].status").value("SUBMITTED"));
        action(claim, "claimant-1", "{\"action\":\"PICK_UP\"}").andExpect(status().isForbidden());
        action(claim, "officer-1", "{\"action\":\"PICK_UP\"}")
                .andExpect(status().isOk()).andExpect(jsonPath("$.officerId").value("officer-1"));
        action(claim, "officer-2", "{\"action\":\"REQUEST_INFO\",\"message\":\"When?\"}")
                .andExpect(status().isForbidden());
        action(claim, "officer-1", "{\"action\":\"REQUEST_INFO\"}").andExpect(status().isBadRequest());
        action(claim, "officer-1", "{\"action\":\"REQUEST_INFO\",\"message\":\"When?\"}")
                .andExpect(jsonPath("$.status").value("INFO_REQUIRED"));
        action(claim, "claimant-1", "{\"action\":\"SUPPLY_INFO\",\"message\":\"At noon\"}")
                .andExpect(jsonPath("$.status").value("INFO_RECEIVED"));
        action(claim, "officer-1", "{\"action\":\"RESUME_REVIEW\"}")
                .andExpect(jsonPath("$.status").value("UNDER_REVIEW"));
        action(claim, "officer-1", "{\"action\":\"SETTLE\"}").andExpect(status().isConflict());
        action(claim, "officer-1", "{\"action\":\"APPROVE\",\"message\":\"Verified\",\"approvedAmount\":\"100\"}")
                .andExpect(jsonPath("$.status").value("APPROVED"));
        action(claim, "officer-1", "{\"action\":\"SETTLE\"}").andExpect(jsonPath("$.status").value("SETTLED"));
        action(claim, "officer-1", "{\"action\":\"SETTLE\"}").andExpect(status().isConflict());
        mvc.perform(get(claim).header(ACTOR, "claimant-1"))
                .andExpect(jsonPath("$.approvedAmount").value("100"))
                .andExpect(jsonPath("$.history.length()").value(7))
                .andExpect(jsonPath("$.history[3].message").value("At noon"));
    }

    @Test
    void concurrentPickupAllowsExactlyOneOfficer() throws Exception {
        String claim = submit();
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var first = executor.submit(() -> pickupStatus(claim, "officer-1"));
            var second = executor.submit(() -> pickupStatus(claim, "officer-2"));
            assertThat(java.util.List.of(first.get(), second.get())).containsExactlyInAnyOrder(200, 409);
        }
        mvc.perform(get(claim).header(ACTOR, "claimant-1"))
                .andExpect(jsonPath("$.history.length()").value(2));
    }

    @Test
    void rejectsInvalidMoneyAndAllowsAPropertyClaimToBeRejected() throws Exception {
        mvc.perform(post("/api/claims").header(ACTOR, "claimant-1").contentType(APPLICATION_JSON)
                        .content(CLAIM.replace("120.50", "1.234")))
                .andExpect(status().isBadRequest());
        String claim = submit(CLAIM.replace("MOTOR", "PROPERTY"));
        action(claim, "officer-1", "{\"action\":\"PICK_UP\"}").andExpect(status().isOk());
        action(claim, "officer-1", "{\"action\":\"APPROVE\",\"message\":\"Verified\",\"approvedAmount\":\"121\"}")
                .andExpect(status().isBadRequest());
        action(claim, "officer-1", "{\"action\":\"REJECT\",\"message\":\"Coverage excluded\"}")
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    private String submit() throws Exception {
        return submit(CLAIM);
    }

    private String submit(String json) throws Exception {
        return mvc.perform(post("/api/claims").header(ACTOR, "claimant-1").contentType(APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andReturn().getResponse().getHeader("Location");
    }

    private int pickupStatus(String claim, String actor) throws Exception {
        return action(claim, actor, "{\"action\":\"PICK_UP\"}").andReturn().getResponse().getStatus();
    }

    private ResultActions action(String claim, String actor, String json) throws Exception {
        return mvc.perform(post(claim + "/actions").header(ACTOR, actor).contentType(APPLICATION_JSON).content(json));
    }
}
