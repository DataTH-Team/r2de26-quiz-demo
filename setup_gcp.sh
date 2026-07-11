#!/bin/bash
set -e

PROJECT_ID="workshop5-demo"
TOPIC_ID="quiz-events"
DATASET_ID="quiz_dataset"
TABLE_ID="quiz_results"
SUBSCRIPTION_ID="quiz-events-bq-sub"

echo "Using GCP Project: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# 1. Create Pub/Sub Topic if not exists
echo "Creating Pub/Sub topic '$TOPIC_ID'..."
if gcloud pubsub topics describe $TOPIC_ID >/dev/null 2>&1; then
    echo "Pub/Sub topic '$TOPIC_ID' already exists."
else
    gcloud pubsub topics create $TOPIC_ID
    echo "Pub/Sub topic '$TOPIC_ID' created."
fi

# 2. Create BigQuery Dataset if not exists
echo "Creating BigQuery dataset '$DATASET_ID'..."
if bq show --dataset "$PROJECT_ID:$DATASET_ID" >/dev/null 2>&1; then
    echo "BigQuery dataset '$DATASET_ID' already exists."
else
    bq mk --dataset --location=US "$PROJECT_ID:$DATASET_ID"
    echo "BigQuery dataset '$DATASET_ID' created."
fi

# 3. Create BigQuery Table if not exists
echo "Creating BigQuery table '$DATASET_ID.$TABLE_ID'..."
if bq show "$PROJECT_ID:$DATASET_ID.$TABLE_ID" >/dev/null 2>&1; then
    echo "BigQuery table '$DATASET_ID.$TABLE_ID' already exists."
else
    bq mk --table "$PROJECT_ID:$DATASET_ID.$TABLE_ID" \
        session_id:STRING,student_id:STRING,student_name:STRING,score:INTEGER,total_questions:INTEGER,percentage:FLOAT,submitted_at:TIMESTAMP,answers_json:STRING
    echo "BigQuery table '$DATASET_ID.$TABLE_ID' created."
fi

# 4. Get Project Number to determine Pub/Sub service account
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
PUBSUB_SERVICE_ACCOUNT="service-$PROJECT_NUMBER@gcp-sa-pubsub.iam.gserviceaccount.com"
echo "Pub/Sub Service Account: $PUBSUB_SERVICE_ACCOUNT"

# 5. Grant Pub/Sub Service Account permissions for BigQuery
echo "Granting BigQuery roles to Pub/Sub Service Account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PUBSUB_SERVICE_ACCOUNT" \
    --role="roles/bigquery.dataEditor" \
    --no-user-output-enabled

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$PUBSUB_SERVICE_ACCOUNT" \
    --role="roles/bigquery.metadataViewer" \
    --no-user-output-enabled

# 6. Create BigQuery Subscription
echo "Creating BigQuery Pub/Sub Subscription..."
if gcloud pubsub subscriptions describe $SUBSCRIPTION_ID >/dev/null 2>&1; then
    echo "Pub/Sub subscription '$SUBSCRIPTION_ID' already exists."
else
    # Create Pub/Sub BigQuery subscription
    gcloud pubsub subscriptions create $SUBSCRIPTION_ID \
        --topic=$TOPIC_ID \
        --bigquery-table="$PROJECT_ID:$DATASET_ID.$TABLE_ID" \
        --use-topic-schema \
        --drop-unknown-fields
    echo "BigQuery Pub/Sub Subscription '$SUBSCRIPTION_ID' created successfully."
fi

echo "GCP resources setup complete!"
