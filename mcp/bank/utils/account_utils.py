import random
import string
from datetime import datetime

def generate_account_number(account_type: str) -> str:
    prefixes = {'savings': '50', 'current': '60', 'salary': '70', 'fixed_deposit': '80'}
    prefix = prefixes.get(str(account_type).lower(), '50')
    timestamp = int(datetime.now().timestamp() * 1000) % 100000000
    suffix = ''.join(random.choices(string.digits, k=2))
    return f"{prefix}{timestamp:08d}{suffix}"
