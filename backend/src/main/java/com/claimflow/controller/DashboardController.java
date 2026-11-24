package com.claimflow.controller;

import com.claimflow.dto.DashboardContracts.Dashboard;
import com.claimflow.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService dashboard;

    public DashboardController(DashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @GetMapping
    public Dashboard report(@RequestHeader("X-Demo-User-Id") String actor,
                            @RequestParam(required = false) Instant from,
                            @RequestParam(required = false) Instant to) {
        return dashboard.report(actor, from, to);
    }
}
