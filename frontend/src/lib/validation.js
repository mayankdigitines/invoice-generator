export const validateInvoiceForm = (customer, items) => {
  const errors = {};

  // --- Customer Validation ---
  
  // Name
  if (!customer.name || customer.name.trim().length < 2) {
    errors.customerName = 'Customer name must be at least 2 characters.';
  }

  // Phone (Expecting 10 digits for India context, or just general numeric)
  const phoneRegex = /^\d{10}$/;
  if (!customer.phone) {
    errors.customerPhone = 'Phone number is required.';
  } else if (!phoneRegex.test(customer.phone)) {
    errors.customerPhone = 'Phone number must be  10 digits.';
  }

  // Address (Optional, but if exists, meaningful)
  if (customer.address && customer.address.trim().length < 5) {
    errors.customerAddress = 'Address is too short.';
  }

  // --- Items Validation ---
  if (!items || items.length === 0) {
    errors.items = 'At least one item is required.';
  } else {
    items.forEach((item, index) => {
      // Item Name
      if (!item.name || item.name.trim() === '') {
        errors[`item_${index}_name`] = 'Required';
      }

      // Quantity
      if (!item.quantity || item.quantity <= 0) {
        errors[`item_${index}_quantity`] = 'Min 1';
      }

      // Price
      if (item.price === undefined || item.price < 0) {
        errors[`item_${index}_price`] = 'Invalid';
      }

      // GST Rate
      if (item.gstRate < 0 || item.gstRate > 100) {
        errors[`item_${index}_gst`] = '0-100';
      }

      // Discount
      if (item.discount < 0 || item.discount > 100) {
        errors[`item_${index}_discount`] = '0-100';
      }
    });
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
