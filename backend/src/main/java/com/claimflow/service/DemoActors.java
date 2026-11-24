package com.claimflow.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

final class DemoActors {
    static final List<String> OFFICERS = List.of("officer-1", "officer-2");
    private static final List<String> CLAIMANTS = List.of("claimant-1", "claimant-2");

    private DemoActors() {}

    static boolean isOfficer(String actor) {
        if (OFFICERS.contains(actor)) {
            return true;
        }
        if (CLAIMANTS.contains(actor)) {
            return false;
        }
        throw forbidden();
    }

    static ResponseStatusException forbidden() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "Actor cannot perform this operation");
    }
}
