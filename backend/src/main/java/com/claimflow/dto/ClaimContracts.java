package com.claimflow.dto;

import com.claimflow.entity.Claim;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public final class ClaimContracts {
    private ClaimContracts() {}

    public record Create(
            @NotNull Claim.Type type,
            @NotBlank @Pattern(regexp = "MY|SG|TH|ID|PH|VN") String market,
            @NotNull @PastOrPresent LocalDate incidentDate,
            @NotBlank @Size(max = 2000) String description,
            @NotBlank @Pattern(regexp = "[0-9]{1,14}(\\.[0-9]{1,4})?") String requestedAmount,
            @NotBlank @Pattern(regexp = "[A-Z]{3}") String currency) {}

    public record Progress(@NotNull Claim.Action action, @Size(max = 2000) String message,
                           @Pattern(regexp = "[0-9]{1,14}(\\.[0-9]{1,4})?") String approvedAmount) {}

    public record View(Long id, String claimantId, String officerId, Claim.Type type, Claim.Status status,
                       String market, LocalDate incidentDate, String description, String currency,
                       String requestedAmount, String approvedAmount, Instant createdAt, Instant updatedAt,
                       List<Claim.History> history) {
        public static View from(Claim claim, boolean includeHistory) {
            var approved = claim.getApprovedAmount();
            return new View(claim.getId(), claim.getClaimantId(), claim.getOfficerId(), claim.getType(),
                    claim.getStatus(), claim.getMarket(), claim.getIncidentDate(), claim.getDescription(),
                    claim.getCurrency(), claim.getRequestedAmount().stripTrailingZeros().toPlainString(),
                    approved == null ? null : approved.stripTrailingZeros().toPlainString(),
                    claim.getCreatedAt(), claim.getUpdatedAt(), includeHistory ? claim.getHistory() : List.of());
        }
    }
}
