package com.bphuc246.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bphuc246.dto.ApiResponse;
import com.bphuc246.dto.Response.CalibrationSummaryResponse;
import com.bphuc246.service.AdminService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/admin/matchmaking")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminController {

    AdminService adminService;

    @GetMapping("/calibration")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CalibrationSummaryResponse> getCalibration() {
        return ApiResponse.<CalibrationSummaryResponse>builder()
                .result(adminService.getCalibrationSummary())
                .build();
    }
}