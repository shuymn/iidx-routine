import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as ssm from "@aws-cdk/aws-ssm";
import * as cdk from "@aws-cdk/core";
import { ChromiumLayerStack } from "./chromium-layer-stack";

export class IidxRoutineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "Table", {
      tableName: "iidx-routine",
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    const lambdaExecutionRole = new iam.Role(this, "LambdaExecutionRole", {
      roleName: "iidx-routine-role",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"),
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMReadOnlyAccess"),
      ],
    });

    const chromiumLayerVersionArn = ssm.StringParameter.valueForStringParameter(
      this,
      ChromiumLayerStack.SSM_CHROMIUM_LAYER_VERSION_ARN
    );

    const chromiumLayer = lambda.LayerVersion.fromLayerVersionArn(
      this,
      "ChromiumLayer",
      chromiumLayerVersionArn
    );

    const dailyFunction = new lambda.Function(this, "DailyFunction", {
      code: lambda.Code.fromAsset("dist/handlers/daily"),
      functionName: "iidx-routine-daily-handler",
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 1600,
      timeout: cdk.Duration.minutes(5),
      role: lambdaExecutionRole,
      layers: [chromiumLayer],
      tracing: lambda.Tracing.ACTIVE,
    });

    table.grantReadWriteData(dailyFunction);

    // cron(分 時 日 月 曜 年) in UTC
    const dailyRule = new events.Rule(this, "DailyRule", {
      ruleName: "iidx-routine-daily-rule",
      schedule: events.Schedule.expression("cron(0 16 * * ? *)"),
    });

    dailyRule.addTarget(new targets.LambdaFunction(dailyFunction));
  }
}
