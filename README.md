# Relying-Party Receiver

![node](https://img.shields.io/badge/node-20.13.0-339933?logo=nodedotjs) ![aws-cli](https://img.shields.io/badge/aws--cli-2.x-232F3E?logo=amazonwebservices) ![sam-cli](https://img.shields.io/badge/sam--cli-1.x-232F3E?logo=amazonwebservices) ![pre-commit](https://img.shields.io/badge/pre--commit-3.x-FAB040?logo=pre-commit) ![Docker](https://img.shields.io/badge/docker-4.x-2496ED?logo=docker)

[![Publish Main](https://github.com/govuk-one-login/fraud-rpr/actions/workflows/publish-main.yaml/badge.svg?branch=main)](https://github.com/govuk-one-login/fraud-rpr/blob/main/.github/workflows/publish-main.yaml) [![SonarCloud](https://github.com/govuk-one-login/fraud-rpr/actions/workflows/code-quality-sonarcloud.yaml/badge.svg?branch=main)](https://github.com/govuk-one-login/fraud-rpr/blob/main/.github/workflows/code-quality-sonarcloud.yaml) [![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=fraud-rpr&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=fraud-rpr) [![Coverage](https://sonarcloud.io/api/project_badges/measure?project=fraud-rpr&metric=coverage)](https://sonarcloud.io/summary/new_code?id=fraud-rpr)

This is the source code for the Relying Party Receiver (RPR) application. The RPR application demonstrates how serverless functions can receive messages from Shared Signals Framework (SSF).

This page explains:

- [the logic behind the serverless functions](#understanding-the-rpr-functions)
- [how to build and deploy the RPR using AWS](#building-and-deploying-the-rpr-using-aws)

You can read more about the responsibilities of receivers and transmitters, the [Security Event Token](https://datatracker.ietf.org/doc/html/rfc8417) (SET) format

## Understanding the RPR functions

This section explains how the serverless functions implemented in the RPR application work.

The RPR is made up of four main components:

- [an api-gateway](#api-gateway) - acts as the entry point that receives messages in JWS format.
- [a receiver function](#receiver-function) - you must implement the receiver function to receive message from the API Gateway.
- [a validate-sqs-queue](#validate-sqs-queue) - queues payload to be sent to the validate event lambda.
- [a validate event function](#helper-functions) - extracts SET from the JWS message.

### Receiver function

The receiver function is triggered from the API Gateway via a POST request containing a JWS. The receiver function performs basic validation of the JWS (Json Web Signature) request.

The receiver function does the following:

- checks if the request consists of three base-64 encoded strings separated by periods (`.`);

#### Responses

- If a request is successfully checked and processed, then a HTTP 202 status will be returned.
- If the request is badly formatted, then a HTTP 400 status will be returned.
- If any other errors occur, then a HTTP 500 status will be returned.

### Validate SQS Queue

AWS Simple Queue Service (SQS) queues are used between the receiver and validate event functions. If a message fails to send on the first attempt, AWS SQS reattempts to send the message until it reaches the limit, before transferring the message to the associated AWS Dead Letter Queue (DLQ). The reattempt limit is set in the queue redrive policy.

### Validate Event function

The validate function receives messages from the validate sqs queue and verifies the JWS signature. Once the signature is verified, the SET message is extracted from the JWS. Subsequently, the SET message undergoes validation. After validation, the raw SET payload is sent to CloudWatch Logs for the Relying Parties to use in their applications.

### Architecture Diagram

#### Detailed Architecture Diagram

![RPR-Detailed Architecture](https://github.com/govuk-one-login/fraud-rpr/assets/169366112/06d09622-c913-4e63-a05e-61bfaa3bd550)

#### Main Architecture Diagram

![RPR-Page-1](https://github.com/govuk-one-login/fraud-rpr/assets/169366112/8475d560-0a04-413f-8d0d-19e030bc91ef)

## Building and deploying the RPR using AWS

This section explains:

- [what you’ll need to build the application](#before-you-start)
- [how to build the application](#building-the-application)
- [how to test the functions locally](#testing-the-functions-locally)
- [how to deploy the application](#deploying-the-application)
- [how events are logged](#logging-events)

### Before you start

To build the application you’ll need:

- an AWS Account
- an AWS Identity and Access Management (IAM) administrator user account
- an AWS access key pair
- [a GitHub Classic Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) (PAT) with at least the `read:packages` permission so you can download the application dependencies from GitHub

You must build the application before you can deploy it in AWS. To build the application, you’ll need to install:

- [AWS Serverless Application Mode (SAM) Command Line Interface (CLI)](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) to interact with AWS to build, test and deploy the application
- [Node.js](https://nodejs.org/en/download/current) to build the TypeScript application

### Building the application

To build the application:

1. Create a `.npmrc` file at the repository root to store the PAT. This will authenticate you to download the application dependencies from GitHub. Your `.npmrc` file should look like this:

```bash
@govuk-one-login:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:\_authToken={YOUR_AUTH_TOKEN}
```

1. Download and install the TypeScript application dependencies. From the root of the repository, run:

```bash
npm install
```

1. Use the AWS CLI build action to build the application locally. The [application infrastructure config file](template-rpr.yaml) describes the cloud resources and their configuration. The [logic for the serverless functions](/src/lambdas/) is linked to from this config file. From the root of the repository, run:

```bash
sam build --template template-rpr.yaml --region eu-west-2
```

### Testing the functions locally

You can run the serverless functions on your local machine using the `sam local invoke` command. For example:

```bash
sam local invoke receiver-lambda
```

### Deploying the application

We recommend automatically deploying the application using a tool such as AWS CloudFormation or Terraform.

For this project, a [GitHub action](.github/workflows/deploy-branch.yaml) [builds the application](.github/workflows/build.yaml) and [deploys it with AWS CloudFormation](.github/workflows/deploy-to-aws.yaml).

### Logging events

The RPR uses [AWS Powertools](https://github.com/aws-powertools/powertools-lambda-typescript) to log events from each serverless function to AWS CloudWatch.

## Using the recommended developer tools

We recommend these tools if you intend to update the RPR or if you’re writing your own AWS lambda function:

- [VS Code](https://code.visualstudio.com/download) as a preferred code editor for its extensions with AWS
- [AWS Serverless Application Mode (SAM) CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) to build and deploy applications in AWS through the CLI rather than the Web UI
- [Node.js](https://nodejs.org/en/) to build the serverless functions in TypeScript
- [Docker](https://docs.docker.com/desktop/) to test the build action locally with AWS SAM
- [pre-commit](https://pre-commit.com) to run the project's recommended pre-commit hooks - this if required if making changes to this repository

### Configure the recommended developer tools

To configure the tools:

- run `pre-commit install` to install the project's pre-commit hooks to improve security and write cleaner code - you must do this if you’re making changes to this repository
- install the [AWS Toolkit extension for VS Code](https://docs.aws.amazon.com/toolkit-for-vscode/latest/userguide/welcome.html) for a more integrated experience with AWS
- connect the AWS toolkit to your AWS account by running `aws configure sso`
- install the [SonarLint extension for VS Code](https://marketplace.visualstudio.com/items?itemName=SonarSource.sonarlint-vscode) as a TypeScript linter
- use Connected Mode to bind your local repository to the remote repository on SonarCloud
