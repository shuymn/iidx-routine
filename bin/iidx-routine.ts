#!/usr/bin/env node
import "source-map-support/register";
import { readFileSync, writeFileSync, existsSync } from "fs";
import * as path from "path";
import * as cdk from "@aws-cdk/core";
import { SSM } from "aws-sdk";
import { ChromiumLayerStack } from "../lib/chromium-layer-stack";
import { IidxRoutineStack } from "../lib/iidx-routine-stack";

const app = new cdk.App();
new ChromiumLayerStack(app, "ChromiumLayerStack");
new IidxRoutineStack(app, "IidxRoutineStack");
// cdk.outの中身が出力される
app.synth();

// lambda layer を使ったとき、 cdk synth で書き出す template.yml に
// sam local invoke が対応してないのでいい感じに書き換えて動くようにする
(async () => {
  const filepath = path.resolve(__dirname, "../cdk.out/IidxRoutineStack.template.json");
  if (!existsSync(filepath)) {
    return;
  }
  const template = JSON.parse(readFileSync(filepath, "utf-8"));

  const key = Object.keys(template.Resources).find((name) => name.match(/^DailyFunction/) !== null);
  if (key === undefined) {
    return;
  }

  const ssm = new SSM();
  const result = await ssm
    .getParameter({
      Name: ChromiumLayerStack.SSM_CHROMIUM_LAYER_VERSION_ARN,
      WithDecryption: true,
    })
    .promise();
  if (result.Parameter === undefined || result.Parameter.Value === undefined) {
    return;
  }
  const chromiumLayerVersionArn = result.Parameter.Value;
  // Ref じゃなくて Arn を直接指定する
  template.Resources[key].Properties.Layers = [chromiumLayerVersionArn];

  writeFileSync(filepath, JSON.stringify(template, null, " "));
})();
