#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SqsRetryDlqStack } from '../lib/sqs-retry-dlq-stack';

const app = new cdk.App();
new SqsRetryDlqStack(app, 'SqsRetryDlqStack');
