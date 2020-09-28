import { AWSError, DynamoDB } from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { PromiseResult } from "aws-sdk/lib/request";
import { log } from "./log";

export class DynamoDb {
  readonly TABLE_NAME = "iidx-routine";

  readonly client: DocumentClient;

  constructor() {
    this.client = new DynamoDB.DocumentClient();
  }

  async get(
    params: Omit<DocumentClient.GetItemInput, "TableName">
  ): Promise<PromiseResult<DocumentClient.GetItemOutput, AWSError>> {
    log.debug(`dynamodb.get params: ${JSON.stringify(params)}`);
    return await this.client.get({ TableName: this.TABLE_NAME, ...params }).promise();
  }

  async put(
    params: Omit<DocumentClient.PutItemInput, "TableName">
  ): Promise<PromiseResult<DocumentClient.PutItemOutput, AWSError>> {
    log.debug(`dynamodb.put params: ${JSON.stringify(params)}`);
    return await this.client.put({ TableName: this.TABLE_NAME, ...params }).promise();
  }
}
