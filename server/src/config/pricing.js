/**
 * Garment pricing configuration
 * Prices are in INR (₹)
 */
const GARMENT_PRICES = {
  'Shirt': 30,
  'Pants': 40,
  'T-Shirt': 25,
  'Jeans': 50,
  'Saree': 80,
  'Suit (2-piece)': 200,
  'Suit (3-piece)': 300,
  'Jacket': 150,
  'Blazer': 180,
  'Kurta': 40,
  'Lehenga': 250,
  'Dress': 120,
  'Coat': 200,
  'Sweater': 60,
  'Bedsheet': 50,
  'Curtain (per piece)': 80,
  'Blanket': 150,
  'Towel': 20,
};

/**
 * Default processing time in days per garment type
 */
const PROCESSING_DAYS = {
  'Shirt': 1,
  'Pants': 1,
  'T-Shirt': 1,
  'Jeans': 2,
  'Saree': 3,
  'Suit (2-piece)': 3,
  'Suit (3-piece)': 3,
  'Jacket': 2,
  'Blazer': 2,
  'Kurta': 1,
  'Lehenga': 4,
  'Dress': 2,
  'Coat': 3,
  'Sweater': 2,
  'Bedsheet': 1,
  'Curtain (per piece)': 2,
  'Blanket': 2,
  'Towel': 1,
};

// Default processing days for unknown garment types
const DEFAULT_PROCESSING_DAYS = 2;

module.exports = { GARMENT_PRICES, PROCESSING_DAYS, DEFAULT_PROCESSING_DAYS };
