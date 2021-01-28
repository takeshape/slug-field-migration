# TakeShape Slug Field Migration

This project is intended to be used to migrate data from the Title field to the Slug field, turning it into a slug value.

## Setup

1. Clone this repository.
2. Run `npm i` to install dependencies.

## Preparation

1. Go to your TakeShape project.
2. In the dots menu select API Keys.
3. Create a new key with Read/Write permissions.
4. Save your key.
5. Notice the project id from the endpoint.
Looks like this:
```
https://api.takeshape.io/project/<Project Id>/v3/graphql
``` 
6. Edit the shape you need migrated.
7. Create a new "Single Line" content type and call it "Slug".

## Usage instructions

Once you are ready to migrate, execute the following command:
```
TS_API_KEY="<API key>" TS_PROJECT_ID="<Project Id>" TS_SHAPE="Shape" node slugify
```
All your data from the Title field is now migrated into the Slug field in slug format.