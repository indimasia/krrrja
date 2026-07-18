-- Add currency to job_openings, paired with existing salary_min/salary_max.
alter table job_openings
  add column currency text not null default 'USD';

alter table job_openings
  add constraint job_openings_currency_check
  check (currency in ('USD', 'IDR', 'EUR', 'GBP', 'SGD'));
