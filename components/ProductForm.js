import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { ReactSortable } from "react-sortablejs";
import Spinner from "@/components/Spinner";

export default function ProductForm({
    _id,
    title: existingTitle,
    description: existingDescription,
    price: existingPrice,
    priceCOL: existingPriceCOL,
    images: existingImages,
    category: assignedCategory,
    properties: assignedProperties,
    weightAndPrices: existingWeightAndPrices,
    flavors: existingFlavors,
}) {
    const [title, setTitle] = useState(existingTitle || '');
    const [description, setDescription] = useState(existingDescription || '');
    const [category, setCategory] = useState(assignedCategory || '');
    const [productProperties, setProductProperties] = useState(assignedProperties || {});
    const [price, setPrice] = useState(existingPrice || '');
    const [priceCOL, setPriceCOL] = useState(existingPriceCOL || '');
    const [images, setImages] = useState(existingImages || []);
    const [goToProducts, setGoToProducts] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);
    const router = useRouter();
    const [weightAndPrices, setWeightAndPrices] = useState(existingWeightAndPrices || []);
    const [flavors, setFlavors] = useState(existingFlavors ? existingFlavors.join(", ") : "");

    const handleWeightAndPriceChange = (index, field, value) => {
        const updatedWeightAndPrices = [...weightAndPrices];
        updatedWeightAndPrices[index][field] = value;
        setWeightAndPrices(updatedWeightAndPrices);
    };

    const handleAddWeightAndPrice = () => {
        setWeightAndPrices([...weightAndPrices, { weight: '', priceUnit: '' }]);
    };

    const handleFlavorsChange = (ev) => {
        setFlavors(ev.target.value);
    };

    const parseFlavors = () => {
        return flavors.split(",").map(flavor => flavor.trim());
    };

    async function saveProduct(ev) {
        ev.preventDefault();
        const numericWeightAndPrices = weightAndPrices.map(wp => ({
            weight: wp.weight,
            priceUnit: parseFloat(wp.priceUnit),
        }));
        const data = {
            title,
            description,
            price,
            priceCOL,
            weightAndPrices: numericWeightAndPrices,
            flavors: parseFlavors(),
            images,
            category,
            properties: productProperties,
        };
        if (_id) {
            await axios.put('/api/products', { ...data, _id });
        } else {
            await axios.post('/api/products', data);
        }
        setGoToProducts(true);
    }

    useEffect(() => {
        setCategoriesLoading(true);
        axios.get('/api/categories').then(result => {
            setCategories(result.data);
            setCategoriesLoading(false);
        });
    }, []);

    if (goToProducts) {
        router.push('/products');
    }

    async function uploadImages(ev) {
        const files = ev.target?.files;
        if (files?.length > 0) {
            setIsUploading(true);
            const data = new FormData();
            for (const file of files) {
                data.append('file', file);
            }
            const res = await axios.post('/api/upload', data);
            setImages(oldImages => [...oldImages, ...res.data.links]);
            setIsUploading(false);
        }
    }

    function updateImagesOrder(images) {
        setImages(images);
    }

    function setProductProp(propName, value) {
        setProductProperties(prev => {
            const newProductProps = { ...prev };
            newProductProps[propName] = value;
            return newProductProps;
        });
    }

    const propertiesToFill = [];
    if (categories.length > 0 && category) {
        let catInfo = categories.find(({ _id }) => _id === category);
        propertiesToFill.push(...catInfo.properties);
        while (catInfo?.parent?._id) {
            const parentCat = categories.find(({ _id }) => _id === catInfo?.parent?._id);
            propertiesToFill.push(...parentCat.properties);
            catInfo = parentCat;
        }
    }

    return (
        <form onSubmit={saveProduct}>
            <label>Product name</label>
            <input
                type="text"
                placeholder="Product name"
                value={title}
                onChange={ev => setTitle(ev.target.value)}
            />
            <label>Category</label>
            <select
                value={category}
                onChange={ev => setCategory(ev.target.value)}
            >
                <option value="">Uncategorized</option>
                {categories.length > 0 && categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                ))}
            </select>
            {categoriesLoading && <Spinner />}
            {propertiesToFill.length > 0 && propertiesToFill.map(p => (
                <div key={p.name} className="">
                    <label>{p.name[0].toUpperCase() + p.name.substring(1)}</label>
                    <div>
                        <select
                            value={productProperties[p.name]}
                            onChange={ev => setProductProp(p.name, ev.target.value)}
                        >
                            {p.values.map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                    </div>
                </div>
            ))}
            <label>Photos</label>
            <div className="mb-2 flex flex-wrap gap-1">
                <ReactSortable
                    list={images}
                    className="flex flex-wrap gap-1"
                    setList={updateImagesOrder}
                >
                    {!!images?.length && images.map(link => (
                        <div key={link} className="h-24 bg-white p-4 shadow-sm rounded-sm border border-gray-200">
                            <img src={link} alt="" className="rounded-lg" />
                        </div>
                    ))}
                </ReactSortable>
                {isUploading && (
                    <div className="h-24 flex items-center">
                        <Spinner fullWidth={true} />
                    </div>
                )}
                <label className="w-24 h-24 cursor-pointer text-center flex flex-row flex-col items-center justify-center text-sm gap-1 text-primary rounded-sm bg-gray-200 bg-white shadow-sm border border-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <div>Add Image</div>
                    <input type="file" onChange={uploadImages} className="hidden" />
                </label>
            </div>
            <label>Description</label>
            <textarea
                placeholder="Description"
                value={description}
                onChange={ev => setDescription(ev.target.value)}
            />
            <label>Flavors</label>
            <input
                type="text"
                placeholder="Enter flavors separated by commas"
                value={flavors}
                onChange={handleFlavorsChange}
            />
            <label>Weights and Prices</label>
            {weightAndPrices.map((wp, index) => (
                <div key={index} className="flex gap-2 mb-2">
                    <input
                        type="text"
                        placeholder="Weight (e.g., 500g)"
                        min="0"
                        value={wp.weight}
                        onChange={e => handleWeightAndPriceChange(index, 'weight', e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Price (USD)"
                        min="0"
                        value={wp.priceUnit}
                        onChange={e => handleWeightAndPriceChange(index, 'priceUnit', e.target.value)}
                    />
                    <button className="btn-red text-xs" type="button" onClick={() => removeWeightAndPrice(index)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </button>
                </div>
            ))}
            <button type="button" onClick={handleAddWeightAndPrice} className="btn-primary">Add Weight and Price</button>
            <br />
            <label>Price (in COP)</label>
            <input
                type="number"
                placeholder="Price"
                value={priceCOL}
                onChange={ev => setPriceCOL(ev.target.value)}
            />
            <label>Price (in USD)</label>
            <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={ev => setPrice(ev.target.value)}
            />
            <button type="submit" className="btn-primary">Save</button>
        </form>
    );
}
