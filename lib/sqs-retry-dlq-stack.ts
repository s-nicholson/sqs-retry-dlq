import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class SqsRetryDlqStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const dlq = new sqs.Queue(this, 'DLQ', {
      visibilityTimeout: Duration.seconds(10)
    });

    const queue = new sqs.Queue(this, 'InboundQueue', {
      visibilityTimeout: Duration.seconds(10),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3
      }
    });

    const fn = new lambda.Function(this, "MessageHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      functionName: "message-handler-fn",
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log("Messages in batch: " + event.Records.length);
          let batchItemFailures = [];
          for (const message of event.Records) {
            try {
              console.log("Processing message: " + message.messageId)
              await processMessageAsync(message);
            } catch (err) {
              console.log("Error occurred processing message: " + message.messageId)
              batchItemFailures.push({ itemIdentifier: message.messageId });
            }
          }
          console.log("Failures in batch: " + batchItemFailures.length);
          return { batchItemFailures };
        };

        async function processMessageAsync(message) {
          if (message.body && message.body.includes("error")) {
            throw new Error("There is an error in the SQS Message.");
          }
          await Promise.resolve(1);
        }
      `),
      handler: 'index.handler',
    });

    fn.addEventSource(new SqsEventSource(queue, {
      reportBatchItemFailures: true,
      batchSize: 5,
      maxBatchingWindow: Duration.seconds(10)
    }));
  }
}
