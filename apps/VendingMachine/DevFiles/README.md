# Interact with VendingMachine Contract

```bash
cp .env.example .env
```

```bash
bun repl
```

**Inside repl, import the functions you want to call**

```bash
> import {updateCollectionUri, toggleMint} from "./VendingMachineOperations"
```

**Call the function**

```bash
> updateCollectionUri("https://NewURI.com/file.json")
```
