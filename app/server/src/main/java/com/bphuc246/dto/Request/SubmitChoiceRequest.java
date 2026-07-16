package com.bphuc246.dto.Request;

import com.bphuc246.entity.Round.GameChoice;
import jakarta.validation.constraints.NotNull;

public record SubmitChoiceRequest(@NotNull GameChoice choice) {}