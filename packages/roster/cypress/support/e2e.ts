/// <reference types="cypress" />
import '@testing-library/cypress/add-commands';

// Custom commands for authentication
Cypress.Commands.add('login', (username: string, password: string) => {
  cy.visit('/login');
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Custom commands for musician management
Cypress.Commands.add(
  'addMusician',
  (musician: {
    name: string;
    instrument: string;
    email: string;
    phone: string;
    experience: string;
    availability: string;
    notes: string;
  }) => {
    cy.get('button').contains('Add Musician').click();
    cy.get('input[name="name"]').type(musician.name);
    cy.get('input[name="instrument"]').type(musician.instrument);
    cy.get('input[name="email"]').type(musician.email);
    cy.get('input[name="phone"]').type(musician.phone);
    cy.get('input[name="experience"]').type(musician.experience);
    cy.get('input[name="availability"]').type(musician.availability);
    cy.get('textarea[name="notes"]').type(musician.notes);
    cy.get('button[type="submit"]').click();
  }
);

// Extend Cypress namespace
declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>;
      addMusician(musician: {
        name: string;
        instrument: string;
        email: string;
        phone: string;
        experience: string;
        availability: string;
        notes: string;
      }): Chainable<void>;
    }
  }
}
