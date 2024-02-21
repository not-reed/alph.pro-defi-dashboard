import { images, labels, attributes } from "../src/data"
import { join } from 'path'


async function writeFiles() {
    await Bun.write(join(__dirname, '../public/collection/collection.json'), JSON.stringify({
        name: 'Alephium Vending Machine',
        image: 'https://arweave.net/nv8fvKlzM5iEnbbtZl5KSRods-hnUf52CyNw_SkPHnQ/banner.png',
        description: 'Alephium Vending Machine Collection - NFT snacks for your next Open Office call',
    }));

    const traits = await getTraits()

    for (const imageIdx in images) {

        try {
            const arweaveHash = 'wSJFV6Uph-Y07rY94yfKchrypMcWtCLXhdUVr399sJ8'
            const file = Bun.file(join(__dirname, "../src/assets/foods/svgs/", `${images[imageIdx]}.svg`));
            await Bun.write(join(__dirname, "../public/images/", `${images[imageIdx]}.svg`), file);
            await Bun.write(join(__dirname, '../public/collection/metadata/', `${Number(imageIdx) + 1}`), JSON.stringify({
                image: `https://arweave.net/${arweaveHash}/${imageIdx}.svg`,
                name: labels[imageIdx],
                attributes: [
                    ...attributes[images[imageIdx]],
                    ...traits[images[imageIdx]]
                ]
            }, null, 2));
        } catch {
            console.log({ error: 'missing traits', imageIdx, image: images[imageIdx] })
        }
    }
}

async function getTraits() {
    interface Trait {
        trait_type: string
        value: string
    }

    const f = await ((await Bun.file('./scripts/facts.md')).text())
    const sections: Record<string, Trait[]> = {}
    let section = ''
    for (const line of f.split('\n')) {
        const trimmed = line.trim()
        if (trimmed.startsWith('#')) {
            section = trimmed.slice(2).trim()
            sections[section] = []
        } else if (trimmed) {
            const [key, value] = trimmed.split(':')
            sections[section].push({ trait_type: key, value: value.trim()})
        }
    }

    return sections as Record<keyof typeof attributes, Trait[]>
}


await writeFiles()
