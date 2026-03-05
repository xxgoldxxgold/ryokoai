export const AI_TOOLS = [
  {
    name: "search_hotels",
    description: "Search hotels and generate booking links for multiple OTAs. IMPORTANT: You MUST provide estimated_prices with realistic nightly rate estimates in JPY for each price tier (budget, standard, premium). Base your estimates on your knowledge of hotel prices in that destination.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: {
          type: "string",
          description: "City or area name (e.g., 'Waikiki', 'Tokyo', 'Paris')"
        },
        check_in: {
          type: "string",
          description: "Check-in date in YYYY-MM-DD format"
        },
        check_out: {
          type: "string",
          description: "Check-out date in YYYY-MM-DD format"
        },
        adults: {
          type: "number",
          description: "Number of adult guests"
        },
        estimated_prices: {
          type: "object",
          description: "REQUIRED: Your estimated nightly hotel rates in JPY for this destination. Provide realistic estimates based on your knowledge.",
          properties: {
            budget: { type: "number", description: "Budget hotel nightly rate in JPY (e.g., 5000-8000 for Tokyo)" },
            standard: { type: "number", description: "Standard hotel nightly rate in JPY (e.g., 10000-20000 for Tokyo)" },
            premium: { type: "number", description: "Premium/luxury hotel nightly rate in JPY (e.g., 30000-80000 for Tokyo)" }
          },
          required: ["budget", "standard", "premium"]
        }
      },
      required: ["destination", "check_in", "check_out", "adults", "estimated_prices"]
    }
  },
  {
    name: "search_flights",
    description: "Search flights with real-time price comparison across multiple airlines and booking sites. Use this when the user wants to find flights.",
    input_schema: {
      type: "object" as const,
      properties: {
        origin: {
          type: "string",
          description: "Origin city or IATA airport code (e.g., 'TYO', 'LAX', 'NRT')"
        },
        destination: {
          type: "string",
          description: "Destination city or IATA airport code (e.g., 'HNL', 'CDG')"
        },
        depart_date: {
          type: "string",
          description: "Departure date in YYYY-MM-DD format"
        },
        return_date: {
          type: "string",
          description: "Return date in YYYY-MM-DD format (omit for one-way)"
        },
        adults: {
          type: "number",
          description: "Number of adult passengers"
        },
        cabin_class: {
          type: "string",
          enum: ["economy", "business", "first"],
          description: "Cabin class (default: economy)"
        }
      },
      required: ["origin", "destination", "depart_date", "adults"]
    }
  },
  {
    name: "create_itinerary",
    description: "Create a detailed day-by-day travel itinerary. Use this after the user has chosen their hotel and/or flights, or when they ask for a trip plan.",
    input_schema: {
      type: "object" as const,
      properties: {
        destination: {
          type: "string",
          description: "Travel destination"
        },
        start_date: {
          type: "string",
          description: "Trip start date YYYY-MM-DD"
        },
        end_date: {
          type: "string",
          description: "Trip end date YYYY-MM-DD"
        },
        interests: {
          type: "array",
          items: { type: "string" },
          description: "User interests (e.g., ['beach', 'surfing', 'local food', 'temples'])"
        },
        budget_remaining: {
          type: "number",
          description: "Remaining budget for activities after hotel and flights (USD)"
        }
      },
      required: ["destination", "start_date", "end_date"]
    }
  }
];
