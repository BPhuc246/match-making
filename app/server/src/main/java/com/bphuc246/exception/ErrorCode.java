package com.bphuc246.exception;


import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.Getter;


@Getter
public enum ErrorCode {

    UNCATEGORIZED_EXCEPTION(9999,"Uncategorized error",HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_INPUT(1001,"All fields are required",HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002,"User already existed",HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003,"Username must be between 4 and 20 characters",HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004,"Password must be at least 6 characters",HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005,"User not existed",HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006,"Unauthenticated",HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007,"You do not have permission",HttpStatus.FORBIDDEN),
    INVALID_EMAIL(1008,"Invalid email domain",HttpStatus.BAD_REQUEST),
    INVALID_USERNAME(1009,"Invalid ussername",HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1010,"Email already existed",HttpStatus.BAD_REQUEST),
    EMAIL_NOTFOUND(1011,"Email not exist",HttpStatus.NOT_FOUND),
    PROBLEM_ALREADY_EXISTS(1012,"Problem existed", HttpStatus.BAD_REQUEST),
    APPROACH_NOT_FOUND(1013,"Approach not found", HttpStatus.NOT_FOUND),
    PROBLEM_NOT_FOUND(1014,"Problem not found", HttpStatus.NOT_FOUND);


    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }
   
    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}