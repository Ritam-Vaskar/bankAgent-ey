import re
from datetime import datetime

class AccountValidator:
    PAN_PATTERN = re.compile(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
    AADHAR_PATTERN = re.compile(r'^[0-9]{12}$')
    VALID_ACCOUNT_TYPES = ['savings', 'current', 'salary', 'fixed_deposit']
    def validate_pan(self, pan: str) -> bool:
        if not pan:
            return False
        return bool(self.PAN_PATTERN.match(pan.upper().strip()))
    def _verhoeff(self, num: str) -> bool:
        d = (
            (0,1,2,3,4,5,6,7,8,9),
            (1,2,3,4,0,6,7,8,9,5),
            (2,3,4,0,1,7,8,9,5,6),
            (3,4,0,1,2,8,9,5,6,7),
            (4,0,1,2,3,9,5,6,7,8),
            (5,9,8,7,6,0,4,3,2,1),
            (6,5,9,8,7,1,0,4,3,2),
            (7,6,5,9,8,2,1,0,4,3),
            (8,7,6,5,9,3,2,1,0,4),
            (9,8,7,6,5,4,3,2,1,0)
        )
        p = (
            (0,1,2,3,4,5,6,7,8,9),
            (1,5,7,6,2,8,3,0,9,4),
            (5,8,0,3,7,9,6,1,4,2),
            (8,9,1,6,0,4,3,5,2,7),
            (9,4,5,3,1,2,6,8,7,0),
            (4,2,8,6,5,7,3,9,0,1),
            (2,7,9,3,8,0,6,4,1,5),
            (7,0,4,6,9,1,3,2,5,8)
        )
        c = 0
        num = num[::-1]
        for i, n in enumerate(num):
            c = d[c][p[i % 8][int(n)]]
        return c == 0
    def validate_aadhar(self, aadhar: str) -> bool:
        if not aadhar:
            return False
        a = re.sub(r'[\s-]', '', str(aadhar))
        if not self.AADHAR_PATTERN.match(a):
            return False
        return self._verhoeff(a)
    def validate_date_of_birth(self, dob: str):
        try:
            d = datetime.strptime(dob, '%Y-%m-%d').date()
            today = datetime.now().date()
            if d > today:
                return False, 'Date of birth cannot be in the future'
            age = (today - d).days / 365.25
            if age < 18:
                return False, 'Minimum age requirement is 18 years'
            if age > 120:
                return False, 'Invalid date of birth'
            return True, ''
        except ValueError:
            return False, 'Invalid date format. Use YYYY-MM-DD'
    def validate_balance(self, balance: float, account_type: str):
        if balance < 0:
            return False, 'Balance cannot be negative'
        min_bal = {'savings': 1000.0, 'current': 5000.0, 'salary': 0.0, 'fixed_deposit': 10000.0}
        mb = min_bal.get(account_type, 0.0)
        if balance < mb:
            return False, f'Minimum balance for {account_type} account is ₹{mb}'
        return True, ''
    def validate_name(self, name: str):
        if not name or not name.strip():
            return False, 'Name is required'
        n = name.strip()
        if len(n) < 2:
            return False, 'Name must be at least 2 characters long'
        if len(n) > 100:
            return False, 'Name cannot exceed 100 characters'
        if not re.match(r"^[a-zA-Z\s.']+$", n):
            return False, 'Name contains invalid characters'
        return True, ''
    def validate_account_data(self, data: dict):
        errors = []
        ok, msg = self.validate_name(data.get('name', ''))
        if not ok: errors.append(f'Name: {msg}')
        ok, msg = self.validate_date_of_birth(data.get('dob', ''))
        if not ok: errors.append(f'Date of Birth: {msg}')
        if not self.validate_pan(data.get('pan_card_no', '')):
            errors.append('Invalid PAN card number format')
        if not self.validate_aadhar(data.get('aadhar_no', '')):
            errors.append('Invalid Aadhar card number')
        acct_type = str(data.get('account_type', '')).lower()
        if acct_type not in self.VALID_ACCOUNT_TYPES:
            errors.append('Invalid account type')
        try:
            bal = float(data.get('balance', 0))
            ok, msg = self.validate_balance(bal, acct_type)
            if not ok: errors.append(f'Balance: {msg}')
        except (ValueError, TypeError):
            errors.append('Invalid balance amount')
        return {"valid": len(errors) == 0, "errors": errors}
