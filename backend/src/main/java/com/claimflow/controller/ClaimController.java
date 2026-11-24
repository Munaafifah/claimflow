package com.claimflow.controller;

import com.claimflow.dto.ClaimContracts.*;
import com.claimflow.entity.Claim;
import com.claimflow.service.ClaimService;
import jakarta.validation.Valid;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {
    private static final String DEMO_ACTOR = "X-Demo-User-Id";
    private final ClaimService claims;

    public ClaimController(ClaimService claims) {
        this.claims = claims;
    }

    @PostMapping
    public ResponseEntity<View> submit(@RequestHeader(DEMO_ACTOR) String actor, @Valid @RequestBody Create request) {
        View claim = claims.submit(actor, request);
        return ResponseEntity.created(URI.create("/api/claims/" + claim.id())).body(claim);
    }

    @GetMapping
    public List<View> list(@RequestHeader(DEMO_ACTOR) String actor,
                           @RequestParam(required = false) Claim.Status status,
                           @RequestParam(required = false) String officerId) {
        return claims.list(actor, status, officerId);
    }

    @GetMapping("/{id}")
    public View detail(@RequestHeader(DEMO_ACTOR) String actor, @PathVariable long id) {
        return claims.detail(actor, id);
    }

    @PostMapping("/{id}/actions")
    public View progress(@RequestHeader(DEMO_ACTOR) String actor, @PathVariable long id,
                         @Valid @RequestBody Progress request) {
        return claims.progress(actor, id, request);
    }

    @ExceptionHandler(Claim.InvalidTransition.class)
    public ProblemDetail invalidTransition(Claim.InvalidTransition error) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, error.getMessage());
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    public ProblemDetail staleUpdate() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Claim changed during this operation");
    }
}
