import unittest
from backend.domain import cents, parse_file, reconcile


class DomainTests(unittest.TestCase):
    def test_money_brazilian_and_decimal_point(self):
        self.assertEqual(cents('R$ 1.250,75'), 125075)
        self.assertEqual(cents('-189.90'), -18990)
        for invalid in ('NaN', 'Infinity', '1.234', 'texto'):
            with self.assertRaises(ValueError):
                cents(invalid)

    def test_invalid_rows_not_silently_removed(self):
        with self.assertRaisesRegex(ValueError, 'Linha 2'):
            parse_file(b'data;descricao;valor\n31/02/2026;Teste;10,00', 'data.csv')

    def test_csv_column_order_and_encoding(self):
        rows = parse_file('valor;descrição;data\n-1.200,00;Serviço;01/10/2026'.encode('cp1252'), 'file.csv')
        self.assertEqual(rows[0], {'date': '2026-10-01', 'description': 'Serviço', 'amount': -120000})

    def test_ambiguity_remains_pending(self):
        bank = [{'date': '2026-10-01', 'description': 'Pix', 'amount': 10000}]
        internal = [{'date': '2026-10-01', 'description': name, 'amount': 10000} for name in ['Cliente A', 'Cliente B']]
        rows = reconcile(bank, internal)
        self.assertEqual([r['status'] for r in rows], ['bank_only', 'internal_only', 'internal_only'])

    def test_duplicate_bank_transaction_does_not_reuse_internal(self):
        row = {'date': '2026-10-01', 'description': 'Cliente', 'amount': 10000}
        rows = reconcile([row, row], [row])
        self.assertEqual([r['status'] for r in rows], ['matched', 'bank_only'])

    def test_exact_description_resolves_equal_value_candidates(self):
        bank = [{'date': '2026-10-01', 'description': 'Cliente A', 'amount': 10000}]
        internal = [bank[0], {**bank[0], 'description': 'Cliente B'}]
        self.assertEqual([r['status'] for r in reconcile(bank, internal)], ['matched', 'internal_only'])


if __name__ == '__main__':
    unittest.main()
