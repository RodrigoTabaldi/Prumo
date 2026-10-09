"""Strict import and one-to-one reconciliation; money is stored in cents."""
import csv
import io
import unicodedata
from collections import defaultdict
from datetime import datetime
from decimal import Decimal, InvalidOperation


def cents(value: str) -> int:
    value = str(value).strip().replace('R$', '').replace(' ', '')
    if ',' in value:
        value = value.replace('.', '').replace(',', '.')
    try:
        amount = Decimal(value)
        if not amount.is_finite() or amount != amount.quantize(Decimal('.01')):
            raise ValueError('O valor deve ter no máximo duas casas decimais.')
        if abs(amount) > Decimal('999999999999.99'):
            raise ValueError('Valor fora do limite permitido.')
        return int(amount * 100)
    except InvalidOperation as exc:
        raise ValueError('Valor monetário inválido.') from exc


def date(value: str) -> str:
    for fmt in ('%d/%m/%Y', '%Y-%m-%d'):
        try:
            return datetime.strptime(value.strip(), fmt).date().isoformat()
        except ValueError:
            pass
    raise ValueError('Data inválida. Use DD/MM/AAAA ou AAAA-MM-DD.')


def normalize(value: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', value.lower().strip()) if unicodedata.category(c) != 'Mn')


def parse_file(content: bytes, filename: str) -> list[dict]:
    try:
        text = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        text = content.decode('cp1252')
    if filename.lower().endswith('.ofx'):
        from ofxparse import OfxParser
        try:
            ofx = OfxParser.parse(io.StringIO(text))
            if len(ofx.accounts) != 1:
                raise ValueError('Importe um OFX de uma única conta.')
            rows = [{'date': t.date.date().isoformat(), 'description': t.memo or t.payee or 'Sem descrição', 'amount': cents(str(t.amount))} for t in ofx.account.statement.transactions]
        except Exception as exc:
            raise ValueError('OFX inválido ou com múltiplas contas. Exporte uma única conta.') from exc
    elif filename.lower().endswith('.csv'):
        try:
            dialect = csv.Sniffer().sniff(text[:8192], delimiters=';,\t')
        except csv.Error as exc:
            raise ValueError('CSV inválido. Utilize o modelo disponível.') from exc
        reader = csv.DictReader(io.StringIO(text), dialect=dialect)
        aliases = {'data': 'date', 'date': 'date', 'descricao': 'description', 'historico': 'description', 'description': 'description', 'valor': 'amount', 'amount': 'amount'}
        mapping = {key: aliases.get(normalize(key)) for key in (reader.fieldnames or [])}
        if set(mapping.values()) - {None} != {'date', 'description', 'amount'} or len([v for v in mapping.values() if v]) != 3:
            raise ValueError('Colunas necessárias: data, descricao e valor, sem duplicação.')
        rows = []
        for number, row in enumerate(reader, 2):
            try:
                if None in row:
                    raise ValueError('Quantidade de colunas inválida.')
                record = {target: row[key] for key, target in mapping.items() if target}
                description = record['description'].strip()
                if not description or len(description) > 500:
                    raise ValueError('Descrição vazia ou maior que 500 caracteres.')
                rows.append({'date': date(record['date']), 'description': description, 'amount': cents(record['amount'])})
            except (ValueError, AttributeError, TypeError) as exc:
                raise ValueError(f'Linha {number}: {exc}') from exc
    else:
        raise ValueError('Formato não suportado. Utilize CSV ou OFX.')
    if not rows or len(rows) > 10000:
        raise ValueError('O arquivo deve conter entre 1 e 10.000 transações.')
    return rows


def reconcile(bank: list[dict], internal: list[dict]) -> list[dict]:
    candidates = defaultdict(list)
    for index, row in enumerate(internal):
        candidates[(row['date'], row['amount'])].append(index)
    used = set()
    result = []
    for row in bank:
        choices = candidates[(row['date'], row['amount'])]
        available = [i for i in choices if i not in used]
        exact = [i for i in available if normalize(internal[i]['description']) == normalize(row['description'])]
        # Ambiguous equal-value entries remain pending instead of arbitrary matching.
        match = exact[0] if len(exact) == 1 else (available[0] if len(available) == 1 else None)
        if match is not None:
            used.add(match)
        result.append({'bank': row, 'internal': internal[match] if match is not None else None, 'status': 'matched' if match is not None else 'bank_only', 'note': ''})
    result.extend({'bank': None, 'internal': row, 'status': 'internal_only', 'note': ''} for i, row in enumerate(internal) if i not in used)
    return result
