import { NetworkIndicatorComponent } from './network-indicator.component';

const textSelector = 'div.alert';

describe('NetworkIndicatorComponent', () => {
  beforeEach(() => {
    cy.mount('<w3s-network-indicator></w3s-network-indicator>', {
      declarations: [NetworkIndicatorComponent],
      providers: []
    });
  });

  describe('when service emits no chainId', () => {
    it('shows no text', () => {
      cy.get(textSelector).should('not.exist');
    });
  });

  describe('when service emits correct chainId', () => {
    it('shows no text', () => {
      cy.get(textSelector).should('not.exist');
    });
  });

  describe('when service emits wrong chainId', () => {
    it('shows warning text', () => {
      cy.get(textSelector).should('exist');
    });
  });

})
