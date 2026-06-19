package domain

type AIChatRequest struct {
	Message string         `json:"message"`
	Context *AIChatContext `json:"context,omitempty"`
}

type AIChatContext struct {
	City        string  `json:"city,omitempty"`
	ServiceType string  `json:"service_type,omitempty"`
	Description string  `json:"description,omitempty"`
	BudgetMin   float64 `json:"budget_min,omitempty"`
	BudgetMax   float64 `json:"budget_max,omitempty"`
	ScheduledAt string  `json:"scheduled_at,omitempty"`
}

type AIChatResponse struct {
	Message              string                `json:"message"`
	Intent               string                `json:"intent"`
	DraftJobRequest      *DraftJobRequest      `json:"draft_job_request,omitempty"`
	Classification       *AIClassification     `json:"classification,omitempty"`
	EstimatedPrice       *EstimatedPrice       `json:"estimated_price,omitempty"`
	RepairSteps          []string              `json:"repair_steps,omitempty"`
	RecommendedProviders []RecommendedProvider `json:"recommended_providers,omitempty"`
	Missing              []string              `json:"missing,omitempty"`
}

type DraftJobRequest struct {
	City        string  `json:"city"`
	ServiceType string  `json:"service_type"`
	Description string  `json:"description"`
	BudgetMin   float64 `json:"budget_min"`
	BudgetMax   float64 `json:"budget_max"`
	ScheduledAt string  `json:"scheduled_at"`
}

type AIClassification struct {
	ServiceType        string   `json:"service_type"`
	Urgency            string   `json:"urgency"`
	BudgetSegment      string   `json:"budget_segment"`
	AdditionalServices []string `json:"additional_services"`
}

type EstimatedPrice struct {
	MinPrice      float64 `json:"min_price"`
	MaxPrice      float64 `json:"max_price"`
	EstimatedDays int32   `json:"estimated_days"`
	Comment       string  `json:"comment"`
}

type RecommendedProvider struct {
	ID        int64   `json:"id"`
	FullName  string  `json:"full_name"`
	City      string  `json:"city"`
	Specialty string  `json:"specialty"`
	Rating    float64 `json:"rating"`
	Reason    string  `json:"reason"`
}
