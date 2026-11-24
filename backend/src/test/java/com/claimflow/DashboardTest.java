package com.claimflow;

import com.claimflow.entity.Claim;
import com.claimflow.entity.Claim.Action;
import com.claimflow.entity.Claim.Type;
import com.claimflow.repository.ClaimRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:dashboard",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class DashboardTest {
    private static final Instant START = Instant.parse("2026-01-01T00:00:00Z");
    private static final String ACTOR = "X-Demo-User-Id";

    @Autowired private MockMvc mvc;
    @Autowired private ClaimRepository repository;

    @BeforeEach
    void resetClaims() {
        repository.deleteAll();
    }

    @Test
    void reportsSnapshotAndPerformanceAcrossCurrenciesAndStatuses() throws Exception {
        seedClaims();
        report()
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.total").value(6))
                .andExpect(jsonPath("$.summary.unassigned").value(2))
                .andExpect(jsonPath("$.summary.active").value(4))
                .andExpect(jsonPath("$.summary.completed").value(2))
                .andExpect(jsonPath("$.officerWorkload[0].officerId").value("officer-1"))
                .andExpect(jsonPath("$.officerWorkload[0].active").value(1))
                .andExpect(jsonPath("$.officerWorkload[0].byStatus.APPROVED").value(1))
                .andExpect(jsonPath("$.officerWorkload[1].byStatus.INFO_REQUIRED").value(1))
                .andExpect(jsonPath("$.outstandingClaims.length()").value(3))
                .andExpect(jsonPath("$.outstandingClaims[0].market").value("MY"))
                .andExpect(jsonPath("$.outstandingClaims[0].type").value("MOTOR"))
                .andExpect(jsonPath("$.outstandingClaims[0].status").value("SUBMITTED"))
                .andExpect(jsonPath("$.outstandingClaims[0].count").value(2))
                .andExpect(jsonPath("$.exposureByCurrency[0].currency").value("MYR"))
                .andExpect(jsonPath("$.exposureByCurrency[0].amount").value("35.5"))
                .andExpect(jsonPath("$.exposureByCurrency[1].currency").value("SGD"))
                .andExpect(jsonPath("$.exposureByCurrency[1].amount").value("30"))
                .andExpect(jsonPath("$.performance.approved").value(2))
                .andExpect(jsonPath("$.performance.settled").value(1))
                .andExpect(jsonPath("$.performance.rejected").value(1))
                .andExpect(jsonPath("$.performance.averageResolutionSeconds").value(35.0))
                .andExpect(jsonPath("$.performance.byOfficer[0].averageResolutionSeconds").value(40.0))
                .andExpect(jsonPath("$.performance.byOfficer[1].averageResolutionSeconds").value(30.0));
    }

    @Test
    void periodIncludesStartExcludesEndAndLeavesSnapshotUnfiltered() throws Exception {
        seedClaims();
        mvc.perform(get("/api/dashboard").header(ACTOR, "officer-2")
                        .param("from", START.plusSeconds(20).toString())
                        .param("to", START.plusSeconds(40).toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.total").value(6))
                .andExpect(jsonPath("$.exposureByCurrency[0].amount").value("35.5"))
                .andExpect(jsonPath("$.performance.approved").value(2))
                .andExpect(jsonPath("$.performance.settled").value(0))
                .andExpect(jsonPath("$.performance.rejected").value(1))
                .andExpect(jsonPath("$.performance.averageResolutionSeconds").value(30.0))
                .andExpect(jsonPath("$.performance.byOfficer[0].approved").value(2))
                .andExpect(jsonPath("$.performance.byOfficer[0].averageResolutionSeconds").isEmpty())
                .andExpect(jsonPath("$.performance.byOfficer[1].rejected").value(1));
    }

    @Test
    void emptyDashboardIncludesBothOfficersAndNoAverage() throws Exception {
        report()
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.total").value(0))
                .andExpect(jsonPath("$.officerWorkload.length()").value(2))
                .andExpect(jsonPath("$.officerWorkload[1].active").value(0))
                .andExpect(jsonPath("$.outstandingClaims").isEmpty())
                .andExpect(jsonPath("$.exposureByCurrency").isEmpty())
                .andExpect(jsonPath("$.performance.averageResolutionSeconds").isEmpty());
    }

    @Test
    void rejectsClaimantsUnknownActorsAndInvalidDates() throws Exception {
        for (String actor : List.of("claimant-1", "unknown")) {
            mvc.perform(get("/api/dashboard").header(ACTOR, actor)).andExpect(status().isForbidden());
        }
        mvc.perform(get("/api/dashboard")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/dashboard").header(ACTOR, "officer-1").param("from", START.toString()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/dashboard").header(ACTOR, "officer-1")
                        .param("from", START.plusSeconds(1).toString()).param("to", START.toString()))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/dashboard").header(ACTOR, "officer-1")
                        .param("from", "invalid-date").param("to", START.toString()))
                .andExpect(status().isBadRequest());
    }

    private ResultActions report() throws Exception {
        return mvc.perform(get("/api/dashboard").header(ACTOR, "officer-1"));
    }

    private void seedClaims() {
        Claim submitted = claim(Type.MOTOR, "MY", "MYR", "10.25");
        Claim secondSubmitted = claim(Type.MOTOR, "MY", "MYR", "5.25");
        Claim waiting = claim(Type.PROPERTY, "SG", "SGD", "30");
        waiting.progress(Action.PICK_UP, "officer-2", null, null, START.plusSeconds(10));
        waiting.progress(Action.REQUEST_INFO, "officer-2", "Please provide details", null, START.plusSeconds(11));
        Claim approved = approvedClaim();
        Claim settled = approvedClaim();
        settled.progress(Action.SETTLE, "officer-1", null, null, START.plusSeconds(40));
        Claim rejected = claim(Type.PROPERTY, "SG", "SGD", "100");
        rejected.progress(Action.PICK_UP, "officer-2", null, null, START.plusSeconds(10));
        rejected.progress(Action.REJECT, "officer-2", "Excluded", null, START.plusSeconds(30));
        repository.saveAllAndFlush(List.of(submitted, secondSubmitted, waiting, approved, settled, rejected));
    }

    private Claim approvedClaim() {
        Claim claim = claim(Type.MOTOR, "MY", "MYR", "50");
        claim.progress(Action.PICK_UP, "officer-1", null, null, START.plusSeconds(10));
        claim.progress(Action.APPROVE, "officer-1", "Approved", new BigDecimal("20"), START.plusSeconds(20));
        return claim;
    }

    private Claim claim(Type type, String market, String currency, String amount) {
        return new Claim("claimant-1", type, market, LocalDate.of(2025, 12, 31),
                "Demo incident", currency, new BigDecimal(amount), START);
    }
}
