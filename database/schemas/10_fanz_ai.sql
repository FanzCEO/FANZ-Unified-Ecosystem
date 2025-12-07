-- =====================================================
-- FANZ AI DATABASE
-- AI prompts, moderation, embeddings, predictions
-- Used by: FanzAI, All Platforms (AI features)
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector for embeddings

-- =====================================================
-- PROMPTS SCHEMA - AI prompt management
-- =====================================================

CREATE SCHEMA prompts;

-- =====================================================
-- PROMPT TEMPLATES
-- =====================================================

CREATE TABLE prompts.templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Template details
    template_name VARCHAR(255) NOT NULL UNIQUE,
    template_description TEXT,

    -- Category
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'content_generation', 'chat_companion', 'moderation', 'classification',
        'summarization', 'translation', 'creative_writing', 'code_generation'
    )),

    -- Prompt content
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL,
    variable_placeholders TEXT[], -- e.g., ['username', 'content_type']

    -- Model configuration
    recommended_model VARCHAR(100),
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,
    top_p DECIMAL(3,2) DEFAULT 0.95,
    frequency_penalty DECIMAL(3,2) DEFAULT 0,
    presence_penalty DECIMAL(3,2) DEFAULT 0,

    -- Version control
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    parent_template_id UUID REFERENCES prompts.templates(template_id),

    -- Performance tracking
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0,
    avg_response_time_ms INTEGER,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_templates_category ON prompts.templates(category, is_active);
CREATE INDEX idx_templates_name ON prompts.templates(template_name);
CREATE INDEX idx_templates_active ON prompts.templates(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE prompts.templates IS 'Reusable AI prompt templates';

-- =====================================================
-- PROMPT EXECUTIONS
-- =====================================================

CREATE TABLE prompts.executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES prompts.templates(template_id),

    -- User context
    user_id UUID,
    platform_id VARCHAR(50) NOT NULL,

    -- Input
    input_variables JSONB NOT NULL,
    full_prompt TEXT NOT NULL,

    -- Model used
    model_name VARCHAR(100) NOT NULL,
    model_provider VARCHAR(50) NOT NULL, -- 'openai', 'huggingface', 'anthropic'

    -- Output
    response_text TEXT,
    response_tokens INTEGER,
    prompt_tokens INTEGER,
    total_tokens INTEGER,

    -- Performance
    response_time_ms INTEGER,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'timeout', 'rate_limited')),
    error_message TEXT,

    -- Cost tracking
    cost_usd DECIMAL(10,6),

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamp
    executed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_executions_template ON prompts.executions(template_id, executed_at DESC);
CREATE INDEX idx_executions_user ON prompts.executions(user_id, executed_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_executions_platform ON prompts.executions(platform_id, executed_at DESC);
CREATE INDEX idx_executions_status ON prompts.executions(status);
CREATE INDEX idx_executions_date ON prompts.executions(executed_at DESC);

COMMENT ON TABLE prompts.executions IS 'AI prompt execution log';

-- =====================================================
-- MODERATION SCHEMA - AI content moderation
-- =====================================================

CREATE SCHEMA moderation;

-- =====================================================
-- MODERATION PREDICTIONS
-- =====================================================

CREATE TABLE moderation.predictions (
    prediction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Content being moderated
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN (
        'text', 'image', 'video', 'audio', 'profile', 'message'
    )),
    content_id UUID NOT NULL,
    content_text TEXT,
    content_url TEXT,

    -- Owner
    user_id UUID NOT NULL,
    creator_id UUID,
    platform_id VARCHAR(50) NOT NULL,

    -- Model used
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),

    -- Predictions
    is_safe BOOLEAN NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL, -- 0-100

    -- Category scores
    categories JSONB NOT NULL, -- e.g., {"violence": 0.05, "sexual": 0.92, "hate": 0.01}

    -- Detected labels
    detected_labels TEXT[],
    flagged_labels TEXT[],

    -- Risk assessment
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('none', 'low', 'medium', 'high', 'critical')),

    -- Action recommendation
    recommended_action VARCHAR(30) CHECK (recommended_action IN (
        'approve', 'flag_for_review', 'auto_reject', 'age_restrict', 'require_warning'
    )),

    -- Human review
    requires_human_review BOOLEAN DEFAULT FALSE,
    human_reviewed BOOLEAN DEFAULT FALSE,
    human_review_decision VARCHAR(20),
    human_reviewed_at TIMESTAMP,
    human_reviewed_by UUID,

    -- False positive tracking
    is_false_positive BOOLEAN DEFAULT FALSE,
    false_positive_reason TEXT,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamp
    predicted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_predictions_content ON moderation.predictions(content_type, content_id);
CREATE INDEX idx_predictions_user ON moderation.predictions(user_id, predicted_at DESC);
CREATE INDEX idx_predictions_platform ON moderation.predictions(platform_id, predicted_at DESC);
CREATE INDEX idx_predictions_risk ON moderation.predictions(risk_level, predicted_at DESC);
CREATE INDEX idx_predictions_review ON moderation.predictions(requires_human_review) WHERE requires_human_review = TRUE AND human_reviewed = FALSE;
CREATE INDEX idx_predictions_false_positive ON moderation.predictions(is_false_positive) WHERE is_false_positive = TRUE;

COMMENT ON TABLE moderation.predictions IS 'AI content moderation predictions';

-- =====================================================
-- MODERATION FEEDBACK
-- =====================================================

CREATE TABLE moderation.feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prediction_id UUID NOT NULL REFERENCES moderation.predictions(prediction_id),

    -- Feedback source
    feedback_type VARCHAR(30) NOT NULL CHECK (feedback_type IN (
        'human_override', 'user_appeal', 'false_positive', 'model_correction'
    )),
    provided_by UUID NOT NULL,

    -- Correct classification
    correct_is_safe BOOLEAN NOT NULL,
    correct_categories JSONB,
    correct_labels TEXT[],

    -- Notes
    feedback_notes TEXT,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamp
    provided_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_prediction ON moderation.feedback(prediction_id);
CREATE INDEX idx_feedback_type ON moderation.feedback(feedback_type);
CREATE INDEX idx_feedback_date ON moderation.feedback(provided_at DESC);

COMMENT ON TABLE moderation.feedback IS 'Feedback on AI moderation predictions for model improvement';

-- =====================================================
-- EMBEDDINGS SCHEMA - Vector embeddings
-- =====================================================

CREATE SCHEMA embeddings;

-- =====================================================
-- CONTENT EMBEDDINGS
-- =====================================================

CREATE TABLE embeddings.content_embeddings (
    embedding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Content reference
    content_type VARCHAR(30) NOT NULL CHECK (content_type IN (
        'post', 'profile', 'message', 'product_description', 'bio'
    )),
    content_id UUID NOT NULL,

    -- Content text
    content_text TEXT NOT NULL,
    content_language VARCHAR(10) DEFAULT 'en',

    -- Embedding vector (1536 dimensions for OpenAI ada-002)
    embedding vector(1536) NOT NULL,

    -- Model used
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),

    -- Owner
    user_id UUID,
    creator_id UUID,
    platform_id VARCHAR(50) NOT NULL,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(content_type, content_id)
);

CREATE INDEX idx_embeddings_content ON embeddings.content_embeddings(content_type, content_id);
CREATE INDEX idx_embeddings_user ON embeddings.content_embeddings(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_embeddings_creator ON embeddings.content_embeddings(creator_id) WHERE creator_id IS NOT NULL;
CREATE INDEX idx_embeddings_platform ON embeddings.content_embeddings(platform_id);

-- Vector similarity search index (IVFFlat for approximate nearest neighbor)
CREATE INDEX idx_embeddings_vector ON embeddings.content_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMENT ON TABLE embeddings.content_embeddings IS 'Vector embeddings for semantic search and recommendations';

-- =====================================================
-- SIMILARITY CACHE
-- =====================================================

CREATE TABLE embeddings.similarity_cache (
    cache_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Query embedding
    query_embedding_id UUID NOT NULL REFERENCES embeddings.content_embeddings(embedding_id),

    -- Similar items (pre-computed)
    similar_embedding_ids UUID[] NOT NULL,
    similarity_scores DECIMAL(5,4)[], -- Cosine similarity scores

    -- Cache metadata
    cache_hit_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,

    -- Expiration
    expires_at TIMESTAMP NOT NULL,

    -- Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_similarity_cache_query ON embeddings.similarity_cache(query_embedding_id);
CREATE INDEX idx_similarity_cache_expires ON embeddings.similarity_cache(expires_at);

COMMENT ON TABLE embeddings.similarity_cache IS 'Cached similarity search results for performance';

-- =====================================================
-- RECOMMENDATIONS SCHEMA - AI-powered recommendations
-- =====================================================

CREATE SCHEMA ai_recommendations;

-- =====================================================
-- RECOMMENDATION MODELS
-- =====================================================

CREATE TABLE ai_recommendations.models (
    model_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Model details
    model_name VARCHAR(255) NOT NULL UNIQUE,
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN (
        'collaborative_filtering', 'content_based', 'hybrid', 'neural_network', 'deep_learning'
    )),
    model_description TEXT,

    -- Version
    version VARCHAR(50) NOT NULL,

    -- Configuration
    hyperparameters JSONB,

    -- Performance metrics
    accuracy DECIMAL(5,4),
    precision DECIMAL(5,4),
    recall DECIMAL(5,4),
    f1_score DECIMAL(5,4),

    -- Training
    training_data_size INTEGER,
    trained_at TIMESTAMP,
    trained_by UUID,

    -- Deployment
    is_deployed BOOLEAN DEFAULT FALSE,
    deployed_at TIMESTAMP,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_models_name ON ai_recommendations.models(model_name);
CREATE INDEX idx_models_deployed ON ai_recommendations.models(is_deployed) WHERE is_deployed = TRUE;

COMMENT ON TABLE ai_recommendations.models IS 'AI recommendation model metadata';

-- =====================================================
-- MODEL PREDICTIONS
-- =====================================================

CREATE TABLE ai_recommendations.predictions (
    prediction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID NOT NULL REFERENCES ai_recommendations.models(model_id),

    -- User
    user_id UUID NOT NULL,
    platform_id VARCHAR(50) NOT NULL,

    -- Recommendation type
    recommendation_type VARCHAR(30) NOT NULL CHECK (recommendation_type IN (
        'creator', 'content', 'product'
    )),

    -- Predicted items
    recommended_ids UUID[] NOT NULL,
    confidence_scores DECIMAL(5,4)[] NOT NULL,

    -- Context
    context JSONB, -- User behavior, time of day, etc.

    -- Engagement tracking
    items_viewed UUID[],
    items_clicked UUID[],
    items_converted UUID[],

    -- Performance
    prediction_time_ms INTEGER,

    -- Multi-tenancy
    tenant_id UUID NOT NULL,

    -- Timestamp
    predicted_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_predictions_model ON ai_recommendations.predictions(model_id, predicted_at DESC);
CREATE INDEX idx_predictions_user ON ai_recommendations.predictions(user_id, predicted_at DESC);
CREATE INDEX idx_predictions_platform ON ai_recommendations.predictions(platform_id, predicted_at DESC);

COMMENT ON TABLE ai_recommendations.predictions IS 'AI recommendation predictions';

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON prompts.templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_embeddings_updated_at BEFORE UPDATE ON embeddings.content_embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_models_updated_at BEFORE UPDATE ON ai_recommendations.models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update template usage count
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE prompts.templates
    SET usage_count = usage_count + 1
    WHERE template_id = NEW.template_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_template_usage_trigger AFTER INSERT ON prompts.executions
    FOR EACH ROW EXECUTE FUNCTION update_template_usage();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function for semantic similarity search
CREATE OR REPLACE FUNCTION embeddings.search_similar_content(
    query_embedding vector(1536),
    content_type_filter VARCHAR(30) DEFAULT NULL,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    embedding_id UUID,
    content_type VARCHAR(30),
    content_id UUID,
    content_text TEXT,
    similarity_score DECIMAL(5,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.embedding_id,
        ce.content_type,
        ce.content_id,
        ce.content_text,
        (1 - (ce.embedding <=> query_embedding))::DECIMAL(5,4) as similarity_score
    FROM embeddings.content_embeddings ce
    WHERE content_type_filter IS NULL OR ce.content_type = content_type_filter
    ORDER BY ce.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION embeddings.search_similar_content IS 'Find similar content using cosine similarity';

-- =====================================================
-- VIEWS
-- =====================================================

-- Active prompt templates
CREATE VIEW prompts.active_templates AS
SELECT
    t.template_id,
    t.template_name,
    t.category,
    t.recommended_model,
    t.version,
    t.usage_count,
    t.success_rate,
    t.created_at
FROM prompts.templates t
WHERE t.is_active = TRUE;

COMMENT ON VIEW prompts.active_templates IS 'Currently active prompt templates';

-- High risk moderation queue
CREATE VIEW moderation.high_risk_queue AS
SELECT
    p.prediction_id,
    p.content_type,
    p.content_id,
    p.user_id,
    p.risk_level,
    p.confidence_score,
    p.detected_labels,
    p.recommended_action,
    p.platform_id,
    p.predicted_at
FROM moderation.predictions p
WHERE p.risk_level IN ('high', 'critical')
  AND p.requires_human_review = TRUE
  AND p.human_reviewed = FALSE
ORDER BY p.predicted_at DESC;

COMMENT ON VIEW moderation.high_risk_queue IS 'High risk content requiring human review';

-- =====================================================
-- GRANTS
-- =====================================================

-- Prompts schema access
GRANT SELECT ON ALL TABLES IN SCHEMA prompts TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA prompts TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA prompts TO platform_app_rw;

-- Moderation schema access
GRANT SELECT ON ALL TABLES IN SCHEMA moderation TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA moderation TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA moderation TO platform_app_rw;

-- Embeddings schema access
GRANT SELECT ON ALL TABLES IN SCHEMA embeddings TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA embeddings TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA embeddings TO platform_app_rw;
GRANT EXECUTE ON FUNCTION embeddings.search_similar_content TO platform_app_rw;

-- AI recommendations schema access
GRANT SELECT ON ALL TABLES IN SCHEMA ai_recommendations TO platform_app_ro;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA ai_recommendations TO platform_app_rw;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ai_recommendations TO platform_app_rw;
