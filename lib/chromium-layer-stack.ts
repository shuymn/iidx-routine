import * as lambda from "@aws-cdk/aws-lambda";
import * as ssm from "@aws-cdk/aws-ssm";
import * as cdk from "@aws-cdk/core";

export class ChromiumLayerStack extends cdk.Stack {
  static readonly SSM_CHROMIUM_LAYER_VERSION_ARN =
    "/iidx-routine/production/chromium-layer-version-arn";

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const chromiumLayer = new lambda.LayerVersion(this, "ChromiumLayer", {
      compatibleRuntimes: [lambda.Runtime.NODEJS_12_X],
      code: lambda.Code.fromAsset("dist/layers/chrome_aws_lambda.zip"),
    });

    new ssm.StringParameter(this, "ChromiumLayerVersionArn", {
      parameterName: ChromiumLayerStack.SSM_CHROMIUM_LAYER_VERSION_ARN,
      stringValue: chromiumLayer.layerVersionArn,
    });
  }
}
