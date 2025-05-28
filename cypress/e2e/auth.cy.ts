describe('Authentication', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('should redirect to login page when accessing protected route without auth', () => {
    cy.visit('/dashboard');
    cy.url().should('include', '/login');
  });

  it('should show error message for invalid credentials', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('wrong@example.com');
    cy.get('input[name="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid email or password').should('be.visible');
  });

  it('should successfully log in with valid credentials', () => {
    cy.login('admin@example.com', 'password123');
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome to your dashboard').should('be.visible');
  });

  it('should maintain auth state after page reload', () => {
    cy.login('admin@example.com', 'password123');
    cy.reload();
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome to your dashboard').should('be.visible');
  });

  it('should log out and redirect to login page', () => {
    cy.login('admin@example.com', 'password123');
    cy.get('button').contains('Logout').click();
    cy.url().should('include', '/login');
  });
});
