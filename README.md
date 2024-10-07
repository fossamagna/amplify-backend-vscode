# AWS Amplify Backend VSCode

AWS Amplify Backend VSCode let you following features.

- Explor AWS resources in Amplify Gen2 sandbox environment.
- Switch AWS profile to explor the AWS resources.
- Add/Edit/Remove secrets in sandbox environment.
- monorepo support

## Features

### Resource Explorer

The AWS Backend Explorer gives you a view of the AWS resources in Amplify Sandbox environment that you can work with when using the AWS Backend Explorer.You can open the AWS Resource page of your choice in the AWS Console of your browser.

![Amplify Backend Explorer](images/explorer.gif)

#### Filter resources

You can filter resources in the AWS Resource Explorer.
You can then switch which filter to use with the filter switching action.
In addition, in `settings.json` you can define custom filters with a pair of names and an array of AWS resources in the tree, as shown below.

```json
{
  "amplifyBackend.explorerFilters": [
    {
      "name": "simple",
      "resources": [
        "AWS::AppSync::GraphQLApi",
        "Custom::AmplifyDynamoDBTable",
        "AWS::Lambda::Function",
        "AWS::S3::Bucket"
      ]
    }
  ]
}
```

#### Switch AWS Profile

You can switch AWS Profile to explor the AWS resources.

![Switch AWS Profile](images/switch_profile.gif)

### Secret in sandbox environment

You can view/add/edit/remove secrets in your sandbox environment.

![Secrets Explorer](images/secrets_explorer.gif)

See also [Secrets and environment vars in Amplify Docs](https://docs.amplify.aws/react/deploy-and-host/fullstack-branching/secrets-and-vars/#local-environment).

## Release Notes

See [Changelog](./CHANGELOG.md)
