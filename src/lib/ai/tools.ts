export const AI_TOOLS = [
  {
    name: "search_hotels",
    description: "Search hotels with real-time price comparison across multiple OTAs (Agoda, Booking.com, Expedia, etc.). Use this when the user wants to find accommodation. Returns prices from multiple booking sites so the user can compare and book the cheapest option.",
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
        children: {
          type: "number",
          description: "Number of children (default 0)"
        },
        budget_max_per_night: {
          type: "number",
          description: "Maximum budget per night in USD (optional)"
        },
        star_rating_min: {
          type: "number",
          description: "Minimum star rating 1-5 (optional)"
        }
      },
      required: ["destination", "check_in", "check_out", "adults"]
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
