package com.claimflow.repository;

import com.claimflow.entity.Claim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findAllByOrderByIdDesc();
    List<Claim> findByClaimantIdOrderByIdDesc(String claimantId);

    @Query("select distinct claim from Claim claim left join fetch claim.history")
    List<Claim> findAllWithHistory();
}
