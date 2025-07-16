# Medication Manager
A simple medication tracking app.

## Questions
1. Can a user mark a medication as inactive, or is that reserved for admin/someone else?
1. What scale of users is expected? (100s, 1000s, millions, billions). Assuming 0-1M
1. What scale of medications are expected? Assuming 0-100.
1. Should users be able to modify a medication schedule?
   1. If so, and they delete all scheduled doses, should that mark the medication as inactive?
1. Should the care recipients fit into explicit categories (parent, child, pet, friend, ...)?


## Steps
- [ ] Setup SST skeleton
  - [ ] download/install SST
  - [ ] setup config file
- [ ] Setup DB skeleton
- [ ] Setup backend skeleton
- [ ] Setup frontend skeleton


## Requirements
1. User authentication (basic auth or API key)
1. user can:
   1. add medication for a care recipient
   1. define a schedule for each medication dose
   1. view a list of upcoming medication doses
   1. mark a medication dose as taken
1. each medication must have >= 1 scheduled dose
  1. upon adding a medication, force a dose to be entered before submitting
1. medications cannot be deleted, only marked as inactive (See ?)
1. schedule must support daily and weekly reccurrence

## Data model
1. user
   1. email
   1. name
1. care recipient
   1. name
   1. relationship
1. medication
   1. name
   1. 
1. medication schedule

## UI Components
1. Signup page
1. Login page
1. form to add a medication
1. component to mark a medication as inactive
1. form to define a dose schedule
   1. probably SMTWThFS format. Verify with internet which is standard for healthcare, if any
   1. needs calendar support to show doses in the future
1. list of upcoming medication doses
   1. assuming ordered by date
   1. ?: what size? paginated?

## Tech Stack
1. Infra: SST (API Gateway, Lambda, ...)
1. Backend: Typescript (covered by SST)
1. Frontend: React SSR