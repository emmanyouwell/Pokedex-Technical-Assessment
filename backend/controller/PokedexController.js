const pokemonCache = require('../pokemonCache');
const weaknesses = require('../data/weaknesses.json')
const axios = require('axios');

exports.getPokemon = async (req, res) => {
    try {

        const { offset, search, sort, min, max } = req.query;

        let details = pokemonCache.getData();
        let results = [...details];

        //pagination
        const limit = 10;
        const startIndex = (offset - 1) * limit;
        const endIndex = offset * limit;

        //search feature
        if (search) {
            results = results.filter(pokemon => {
                return (
                    pokemon.name.toLowerCase().includes(search.toLowerCase()) ||
                    pokemon.id.toString().includes(search)
                );
            });
        }

        //filter feature
        if (min !== undefined || max !== undefined) {
            //convert min and max to number or string
            const from = isNaN(min) ? min : Number(min);
            const to = isNaN(max) ? max : Number(max);


            if ((typeof from === "number" && !isNaN(from)) && (typeof to === "number" && !isNaN(to))) { //filter by id

                results = results.filter(pokemon => {
                    return (
                        (from === null || pokemon.id >= from) &&
                        (to === null || pokemon.id <= to) &&
                        pokemon.id !== null
                    );
                }).sort((a, b) => a.id - b.id);
            }
            else if (typeof from === "string" && typeof to === "string") { //filter by name
                results = results.filter(pokemon => {
                    const firstLetter = pokemon.name.charAt(0).toUpperCase();
                    return firstLetter >= from && firstLetter <= to && pokemon.id !== null;
                }).sort((a, b) => a.name.localeCompare(b.name));
            }
        }
        //sort feature
        if (sort) {
            switch (sort) {
                case 'idDesc':
                    results = results.filter(pokemon => (pokemon.id !== null)).sort((a, b) => b.id - a.id);
                    break;
                case 'idAsc':
                    results = results.filter(pokemon => (pokemon.id !== null)).sort((a, b) => a.id - b.id);
                    break;
                case 'nameDesc':
                    results = results.filter(pokemon => (pokemon.id !== null)).sort((a, b) => b.name.localeCompare(a.name));
                    break;
                case 'nameAsc':
                    results = results.filter(pokemon => (pokemon.id !== null)).sort((a, b) => a.name.localeCompare(b.name));
                    break;
                default:
                    break;
            }
        }

        const count = results.length;
        results = results.slice(startIndex, endIndex); //returns 10 pokemons per page

        if (results.length === 0) {
            res.status(404).json({ error: 'Pokemon Not Found' });
            return;
        }
        res.status(200).json({
            success: true,
            count,
            pokemon: results,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}


exports.getSinglePokemon = async (req, res) => {
    try {
        const { id } = req.params;
        const details = pokemonCache.getData();
        const pokemon = details.find(pokemon => pokemon.id === parseInt(id));

        if (!pokemon) {
            res.status(404).json({ error: 'Pokemon Not Found' });
            return;
        }
        const response = await axios.get(pokemon.url);
        if (!response) {
            res.status(404).json({ error: 'Url Not Found' });
            return;
        }

        const weakness = response.data.types.flatMap(type => {
            const formattedType = type.type.name.charAt(0).toUpperCase() + type.type.name.slice(1).toLowerCase(); // Normalize input
            return weaknesses[formattedType] || []; // Return array directly
        });
        
        // Remove duplicates
        const uniqueWeaknesses = [...new Set(weakness)];

        let info = {
            id: response.data.id,
            name: response.data.name,
            height: response.data.height/10,
            weight: response.data.weight/10,
            types: response.data.types,
            stats: response.data.stats,
            weakness: uniqueWeaknesses
        }


        res.status(200).json({
            success: true,
            pokemon: info
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}