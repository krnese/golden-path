# Equipment Tracker Prototype

This is a local-only prototype with seeded test identities. It is not production
authentication and must not be exposed as a production service.

Run it from the repository root:

```powershell
npm start
```

Open `http://127.0.0.1:3000`. Data is stored in the ignored
`.local/equipment.sqlite` database. Delete that specific file when you want to
reset local prototype data.

The asset-manager identity can register and assign equipment and record returns.
Employee identities see only their own assignments and can acknowledge receipt
and return.
