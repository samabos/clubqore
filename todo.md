# ClubQore - Future Enhancements & TODO

## Billing Module - Future Enhancements

### Payment Integration
- [ ] **Payment Gateway Integration**
  - Integrate Stripe for online payments
  - Add PayPal support
  - Support multiple payment methods (card, bank transfer, digital wallets)
  - Implement secure payment processing flow
  - Add payment confirmation and receipt generation

### Notifications & Communication
- [x] **Email Notifications for New Invoices** ✅ COMPLETED
  - ✅ Send email when invoice is published
  - ✅ Bulk email for seasonal invoices
  - ✅ Auto-email for scheduled job invoices
- [ ] **Additional Email Notifications**
  - Reminder emails for upcoming due dates
  - Overdue payment notifications
  - Payment confirmation emails

### Invoice Management
- [ ] **PDF Generation**
  - Generate PDF invoices with club branding
  - Download/print invoice functionality
  - Email PDF invoices to parents
  - Batch PDF generation for reporting

- [ ] **Automatic Overdue Detection**
  - Scheduled worker to mark invoices as overdue
  - Automatic late fee calculation (optional)
  - Escalating reminder system

### Advanced Billing Features
- [ ] **Consolidated Family Billing**
  - Single invoice for multiple children
  - Family discount support
  - Shared payment plans

- [ ] **Payment Plans & Installments**
  - Split invoices into installment payments
  - Automatic installment schedule generation
  - Track installment payment progress

- [ ] **Partial Payments**
  - UI support for recording partial payments
  - Track remaining balance
  - Payment history with multiple transactions

### Reporting & Analytics
- [ ] **Financial Reports**
  - Revenue reports by season/period
  - Outstanding balance reports
  - Payment trends and analytics
  - Overdue aging reports
  - Export to Excel/CSV

- [ ] **Dashboard Enhancements**
  - Revenue trends chart
  - Payment collection rate
  - Seasonal comparison
  - Overdue tracking metrics

### User Experience
- [ ] **Invoice Templates**
  - Predefined line item templates
  - Quick invoice generation from templates
  - Seasonal invoice templates

- [ ] **Tax Management**
  - Automatic tax calculation from club settings
  - Support for multiple tax rates
  - Tax reporting and compliance

- [ ] **Discounts & Coupons**
  - Promo code system
  - Automatic discount application
  - Early payment discounts
  - Sibling discounts

### Additional Features
- [ ] **Recurring Invoices**
  - Set up recurring billing schedules
  - Automatic monthly/quarterly invoicing
  - Subscription-style billing support

- [ ] **Credit Notes**
  - Issue credits for overpayments
  - Refund tracking
  - Credit application to future invoices

- [ ] **Multi-Currency Support**
  - Support for different currencies
  - Exchange rate handling
  - Currency conversion

- [ ] **Invoice Customization**
  - Custom invoice number formats
  - Club logo and branding
  - Customizable invoice footer/terms
  - Custom fields

### Admin Features
- [ ] **Global Billing Settings**
  - Admin can override club billing settings
  - Platform-wide service charge configuration
  - Billing compliance and audit tools

- [ ] **Scheduled Jobs Management**
  - Retry failed jobs from admin panel
  - Manual job triggering
  - Job execution history and logs

## Other Future Enhancements

### General Platform
- [ ] Implement proper toast notification system (replace placeholder)
- [ ] Add comprehensive error handling
- [ ] Implement proper loading states across the app
- [ ] Add unit and integration tests

### Security
- [ ] Implement rate limiting on API endpoints
- [ ] Add audit logs for sensitive operations
- [ ] Implement data encryption for sensitive information

---

**Last Updated:** 2026-01-05
**Note:** For testing instructions, see `backend/test-email-notifications.md`
