describe('Musician Management', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'testpass');
    cy.visit('/musicians');
  });

  it('should load and display musician list', () => {
    cy.contains('Loading').should('be.visible');
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jane Smith').should('be.visible');
  });

  it('should filter musicians by search term', () => {
    cy.get('input[placeholder*="search"]').type('John');
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jane Smith').should('not.exist');
  });

  it('should filter musicians by status', () => {
    cy.get('select[name="status"]').select('active');
    cy.contains('John Doe').should('be.visible');
    cy.contains('Jane Smith').should('be.visible');
  });

  it('should add a new musician', () => {
    const newMusician = {
      name: 'New Musician',
      instrument: 'Drums',
      email: 'new@example.com',
      phone: '+1122334455',
      experience: '3 years',
      availability: 'Flexible',
      notes: 'Drummer',
    };

    cy.addMusician(newMusician);
    cy.contains('Musician added successfully').should('be.visible');
    cy.contains(newMusician.name).should('be.visible');
  });

  it('should edit an existing musician', () => {
    cy.contains('John Doe').parent().find('button').contains('Edit').click();

    cy.get('input[name="name"]').clear().type('John Updated');

    cy.get('button[type="submit"]').click();
    cy.contains('Musician updated successfully').should('be.visible');
    cy.contains('John Updated').should('be.visible');
  });

  it('should show validation errors for invalid form submission', () => {
    cy.get('button').contains('Add Musician').click();
    cy.get('button[type="submit"]').click();

    cy.contains('Name must be at least 2 characters long').should('be.visible');
    cy.contains('Instrument is required').should('be.visible');
    cy.contains('Invalid email address').should('be.visible');
    cy.contains('Invalid phone number').should('be.visible');
  });

  it('should handle mobile view correctly', () => {
    cy.viewport('iphone-6');
    cy.get('button').contains('Add Musician').should('be.visible');
    cy.get('input[placeholder*="search"]').should('be.visible');
    cy.get('select[name="status"]').should('be.visible');
  });
});
