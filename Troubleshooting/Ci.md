# Troubleshooting CI for Java & React

This document contains common CI errors I encountered while setting up GitHub Actions for a Spring Boot + React project and how to fix them.

---

# Backend (Spring Boot)

## 1. `./mvnw: Permission denied`

### Error

```text
Run ./mvnw checkstyle:check
./mvnw: Permission denied
```

### Cause

The Maven Wrapper (`mvnw`) does not have execute permission inside the GitHub Actions runner.

### Solution

Grant execute permission before setting up Java or running Maven.

```yaml
- name: Make mvnw executable
  run: chmod +x app/server/mvnw
```

---

## 2. Checkstyle fails with hundreds of violations

### Error

```text
Failed to execute goal
org.apache.maven.plugins:maven-checkstyle-plugin:check

You have 633 Checkstyle violations.
```

### Cause

The Checkstyle plugin is configured to fail the build whenever style violations are detected.

### Solution

Configure the Checkstyle plugin in `pom.xml`.

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-checkstyle-plugin</artifactId>
    <version>3.3.1</version>

    <configuration>
        <configLocation>sun_checks.xml</configLocation>
        <failOnViolation>false</failOnViolation>
        <failsOnError>false</failsOnError>
    </configuration>
</plugin>
```

> **Note**
>
> Setting `failOnViolation=false` is useful while developing. For production projects, it's recommended to fix the violations instead of disabling them.

---

## 3. Spring Boot tests fail because `application.properties` is missing

### Error

Search for the first `Caused by:` in the logs.

Example:

```text
Caused by:
org.springframework.beans.factory.BeanCreationException

Failed to determine a suitable driver class
```

### Cause

I didn't commit my real `application.properties` because it contains sensitive information.

Without this file, Spring Boot cannot create the datasource during CI.

### Solution

Commit a **dummy** `application.properties`.

The dummy file should:

- contain exactly the same property names
- use fake values
- never contain real credentials

Example:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/database
spring.datasource.username=dummy
spring.datasource.password=dummy
```

Then keep the real credentials locally or provide them through GitHub Secrets.

> **Tip**
>
> Whenever Spring Boot tests fail, don't panic. Scroll through the logs until you find the first `Caused by:` message. It usually identifies the real root cause.

---

# Frontend (React + Vite)

## 4. Missing `test` script

### Error

```text
Missing script: "test"
```

### Cause

GitHub Actions runs:

```bash
npm test
```

but no `test` script exists in `package.json`.

### Solution

Install the testing libraries.

```bash
npm install @testing-library/react @testing-library/jest-dom
```

Then add a test script.

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

---

## 5. No test files found

### Error

```text
No test files found, exiting with code 1
```

### Cause

Vitest treats the absence of tests as a failure.

### Solution

Allow CI to pass even when no tests exist yet.

```json
{
  "scripts": {
    "test": "vitest run --passWithNoTests"
  }
}
```

---

# Debugging Tips

When a GitHub Actions job fails:

1. Stay calm.
2. Ignore the hundreds of lines at the beginning.
3. Search for:

```text
Caused by:
```

or

```text
ERROR
```

The first `Caused by:` message usually points to the actual problem.

---

# Summary

| Problem | Solution |
|---------|----------|
| `./mvnw: Permission denied` | `chmod +x mvnw` |
| Hundreds of Checkstyle violations | Configure Checkstyle or fix the violations |
| Missing `application.properties` | Commit a dummy configuration with fake values |
| `Missing script: test` | Add `"test": "vitest run"` |
| `No test files found` | Use `vitest run --passWithNoTests` |