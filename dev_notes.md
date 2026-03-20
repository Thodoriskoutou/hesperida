# General

## run a single tool for testing

docker compose run --rm probe https://www.mywebsite.com jobs:myjobid

replace `probe` with the tool you want

# Nuclei

## NUCLEI_SEVERITY

- medium
- high
- critical

## command

-as scan by default (automatic)

docker compose run nuclei -severity medium,critical,high -j -u https://www.mywebsite.com -as

manually select templates ?

## get templates db

https://nuclei-templates.netlify.app/db.json.gz

check https://api.github.com/repos/projectdiscovery/nuclei-templates/releases/latest  .tag_name
against the db.json .version, if the github is newer re-download

