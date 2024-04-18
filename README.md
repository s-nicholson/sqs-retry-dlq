# SQS -> Lambda -> Retry -> DLQ

Minimal setup to demo a lambda reading from SQS, retrying on failure, and pushing to DLQ after failed retries.