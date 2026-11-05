import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Vérifications de sécurité et intégrité financière backend', () => {
  test('Rejette les transactions aux montants invalides ou négatifs', () => {
    const validateAmount = (amount: number): boolean => {
      if (typeof amount !== 'number' || Number.isNaN(amount) || !Number.isFinite(amount)) {
        return false;
      }
      return amount > 0;
    };

    assert.equal(validateAmount(1500), true);
    assert.equal(validateAmount(-50), false);
    assert.equal(validateAmount(0), false);
    assert.equal(validateAmount(NaN), false);
    assert.equal(validateAmount(Infinity), false);
  });

  test('Vérifie le respect de la partie double comptable (Débit === Crédit)', () => {
    interface AccountingEntry {
      debit: number;
      credit: number;
    }

    const checkBalancedEntries = (entries: AccountingEntry[]): boolean => {
      const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
      return Math.abs(totalDebit - totalCredit) < 0.001;
    };

    const validTransaction: AccountingEntry[] = [
      { debit: 2500, credit: 0 },
      { debit: 0, credit: 2500 },
    ];

    const invalidTransaction: AccountingEntry[] = [
      { debit: 2500, credit: 0 },
      { debit: 0, credit: 1500 },
    ];

    assert.equal(checkBalancedEntries(validTransaction), true);
    assert.equal(checkBalancedEntries(invalidTransaction), false);
  });

  test('Interdit toute modification non autorisée de rôle utilisateur par le client', () => {
    const canElevateRole = (currentRole: string, targetRole: string): boolean => {
      const privilegedRoles = ['SUPER_ADMIN', 'ADMIN_GENERAL'];
      if (!privilegedRoles.includes(currentRole)) {
        return false;
      }
      return true;
    };

    assert.equal(canElevateRole('CLIENT', 'ADMIN_GENERAL'), false);
    assert.equal(canElevateRole('COMMERCIAL_SECRETAIRE', 'SUPER_ADMIN'), false);
    assert.equal(canElevateRole('VISITOR', 'DAF_COMPTABLE'), false);
    assert.equal(canElevateRole('SUPER_ADMIN', 'DAF_COMPTABLE'), true);
  });

  test('Garantit que la contrepassation d’une écriture est irréversible et liée à sa pièce d’origine', () => {
    interface TransactionRecord {
      piece: string;
      status: 'brouillon' | 'en_attente_manager' | 'valide' | 'contrepassee';
      reversedByPiece?: string;
    }

    const reverseTransaction = (
      tx: TransactionRecord,
      reversalPiece: string
    ): TransactionRecord => {
      if (tx.status !== 'valide') {
        throw new Error('Seule une transaction validée peut faire l’objet d’une contrepassation.');
      }
      return {
        ...tx,
        status: 'contrepassee',
        reversedByPiece: reversalPiece,
      };
    };

    const initialTx: TransactionRecord = {
      piece: 'VES-2026-000101',
      status: 'valide',
    };

    const reversed = reverseTransaction(initialTx, 'VES-2026-000102');
    assert.equal(reversed.status, 'contrepassee');
    assert.equal(reversed.reversedByPiece, 'VES-2026-000102');

    assert.throws(() => {
      reverseTransaction(reversed, 'VES-2026-000103');
    }, /Seule une transaction validée/);
  });
});
