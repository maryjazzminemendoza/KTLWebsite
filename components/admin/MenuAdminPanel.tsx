"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: number | null;
  serving_note: string | null;
  inclusions: string | null;
  price_options: MenuPriceOption[];
  image_url: string | null;
  is_signature: boolean;
  is_best_seller: boolean;
  is_available: boolean;
  display_order: number;
};

type MenuPriceOption = {
  label: string;
  price: number;
};

type FormState = {
  id?: number;
  name: string;
  description: string;
  category: string;
  price: string;
  serving_note: string;
  inclusions: string;
  price_options: MenuPriceOption[];
  image_url: string;
  is_best_seller: boolean;
  is_available: boolean;
  display_order: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  category: "",
  price: "",
  serving_note: "",
  inclusions: "",
  price_options: [],
  image_url: "",
  is_best_seller: false,
  is_available: true,
  display_order: "0",
};

const variationPresets = [
  "Regular",
  "Family size",
  "½ kilo",
  "1 kilo",
  "Small bilao",
  "Big bilao",
];

export default function MenuAdminPanel({
  initialItems,
}: {
  initialItems: MenuItem[];
}) {
  const router = useRouter();

  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return items;

    return items.filter((item) =>
      [
        item.name,
        item.category,
        item.description || "",
        item.serving_note || "",
        item.inclusions || "",
        ...(item.price_options || []).map((option) => option.label),
      ].some((value) =>
        value.toLowerCase().includes(query)
      )
    );
  }, [items, searchQuery]);

  function resetForm() {
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview("");
    setIsEditing(false);
    setMessage("");
  }

  function editItem(item: MenuItem) {
    setIsEditing(true);
    setMessage("");

    setForm({
      id: item.id,
      name: item.name,
      description: item.description || "",
      category: item.category,
      price: item.price !== null ? String(item.price) : "",
      serving_note: item.serving_note || "",
      inclusions: item.inclusions || "",
      price_options: Array.isArray(item.price_options) ? item.price_options : [],
      image_url: item.image_url || "",
      is_best_seller: item.is_best_seller,
      is_available: item.is_available,
      display_order: String(item.display_order || 0),
    });

    setImagePreview(item.image_url || "");
    setImageFile(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please upload a valid image file.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadMenuImage(file: File) {
    setIsUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${fileExt}`;

    const filePath = `menu/${fileName}`;

    const { error } = await supabase.storage
      .from("menu-images")
      .upload(filePath, file);

    if (error) {
      setIsUploading(false);
      throw new Error(error.message);
    }

    const { data } = supabase.storage
      .from("menu-images")
      .getPublicUrl(filePath);

    setIsUploading(false);

    return data.publicUrl;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsSaving(true);
    setMessage("");

    const incompleteOption = form.price_options.some(
      (option) => !option.label.trim() || Number(option.price) <= 0
    );
    const optionNames = form.price_options.map((option) => option.label.trim().toLowerCase());
    const hasDuplicateOptions = new Set(optionNames).size !== optionNames.length;

    if (!form.name.trim() || !form.category.trim()) {
      setMessage("Please enter the dish name and category.");
      setIsSaving(false);
      return;
    }

    if (incompleteOption) {
      setMessage("Each order variation needs a name and a price greater than zero.");
      setIsSaving(false);
      return;
    }

    if (hasDuplicateOptions) {
      setMessage("Variation names must be unique for this menu item.");
      setIsSaving(false);
      return;
    }

    if (!form.price && form.price_options.length === 0) {
      setMessage("Enter a checkout price or add at least one order variation.");
      setIsSaving(false);
      return;
    }

    let uploadedImageUrl = form.image_url;

    if (imageFile) {
      try {
        uploadedImageUrl = await uploadMenuImage(imageFile);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Image upload failed."
        );
        setIsSaving(false);
        setIsUploading(false);
        return;
      }
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim(),
      price: form.price ? Number(form.price) : null,
      serving_note: form.serving_note.trim() || null,
      inclusions: form.inclusions.trim() || null,
      price_options: form.price_options
        .filter((option) => option.label.trim() && Number(option.price) > 0)
        .map((option) => ({ label: option.label.trim(), price: Number(option.price) })),
      image_url: uploadedImageUrl.trim() || null,
      is_best_seller: form.is_best_seller,
      is_available: form.is_available,
      display_order: Number(form.display_order) || 0,
    };

    let result;

    if (isEditing && form.id) {
      result = await supabase
        .from("menu_items")
        .update(payload)
        .eq("id", form.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from("menu_items")
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      setMessage(result.error.message);
      setIsSaving(false);
      return;
    }

    if (isEditing) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === result.data.id ? (result.data as MenuItem) : item
        )
      );
      setMessage("Menu item updated successfully.");
    } else {
      setItems((prev) => [...prev, result.data as MenuItem]);
      setMessage("Menu item added successfully.");
    }

    resetForm();
    router.refresh();
    setIsSaving(false);
  }

  async function deleteItem(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this menu item?"
    );

    if (!confirmed) return;

    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
    setMessage("Menu item deleted successfully.");
    router.refresh();
  }

  async function toggleBestSeller(item: MenuItem) {
    const { data, error } = await supabase
      .from("menu_items")
      .update({ is_best_seller: !item.is_best_seller })
      .eq("id", item.id)
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems((prev) =>
      prev.map((menuItem) =>
        menuItem.id === item.id ? (data as MenuItem) : menuItem
      )
    );

    router.refresh();
  }

  async function toggleAvailability(item: MenuItem) {
    const { data, error } = await supabase
      .from("menu_items")
      .update({ is_available: !item.is_available })
      .eq("id", item.id)
      .select()
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    setItems((prev) =>
      prev.map((menuItem) =>
        menuItem.id === item.id ? (data as MenuItem) : menuItem
      )
    );

    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
      <form
        onSubmit={handleSubmit}
        className="h-fit rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 shadow-[0_18px_45px_rgba(59,39,22,0.08)] lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto"
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-[#3B2716]">
              {isEditing ? "Edit Dish" : "Add Dish"}
            </h2>
            <p className="mt-1 text-sm text-[#6F675E]">
              This updates the live menu content.
            </p>
          </div>

          {isEditing ? (
            <button
              type="button"
              onClick={resetForm}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E4D6C0] text-[#6F675E] transition hover:bg-[#EFE3D1]"
            >
              <X size={18} />
            </button>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2F4530] text-white">
              <Plus size={18} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-[#3B2716]">
              Dish Name
            </span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
              placeholder="Crispy Fried Dalag"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#3B2716]">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
              placeholder="Short description of the dish..."
            />
          </label>

          <div className={`grid gap-4 ${form.price_options.length === 0 ? "sm:grid-cols-2" : ""}`}>
            <label className="block">
              <span className="text-sm font-semibold text-[#3B2716]">
                Category
              </span>
              <input
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
                placeholder="Freshwater Classics"
              />
            </label>

            {form.price_options.length === 0 && (
              <label className="block">
                <span className="text-sm font-semibold text-[#3B2716]">
                  Price
                </span>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
                  placeholder="350"
                />
              </label>
            )}
          </div>

          <p className="-mt-2 text-xs leading-5 text-[#8B7A65]">
            For different sizes or portions, add variations below instead of
            entering multiple prices elsewhere.
          </p>

          <div className="rounded-2xl border border-[#E4D6C0] bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#3B2716]">Order Sizes / Variations</p>
                <p className="mt-1 text-xs leading-5 text-[#8B7A65]">
                  Add each selectable size with its own price. Leave empty for a single-price dish.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    price_options: [...form.price_options, { label: "", price: 0 }],
                  })
                }
                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#E8EFE5] px-3 py-2 text-xs font-bold text-[#2F4530]"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {variationPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={form.price_options.some(
                    (option) => option.label.toLowerCase() === preset.toLowerCase()
                  )}
                  onClick={() =>
                    setForm({
                      ...form,
                      price_options: [...form.price_options, { label: preset, price: 0 }],
                    })
                  }
                  className="rounded-full border border-[#D7C6A8] px-3 py-1.5 text-xs font-semibold text-[#594531] transition hover:border-[#C28B38] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  + {preset}
                </button>
              ))}
            </div>

            {form.price_options.length > 0 && (
              <div className="mt-4 space-y-3">
                {form.price_options.map((option, index) => (
                  <div key={index} className="grid grid-cols-[1fr_110px_36px] gap-2">
                    <input
                      value={option.label}
                      onChange={(event) => {
                        const priceOptions = [...form.price_options];
                        priceOptions[index] = { ...option, label: event.target.value };
                        setForm({ ...form, price_options: priceOptions });
                      }}
                      className="min-w-0 rounded-lg border border-[#E4D6C0] px-3 py-2 text-sm outline-none focus:border-[#C28B38]"
                      placeholder="Family size"
                    />
                    <input
                      type="number"
                      min="0"
                      value={option.price || ""}
                      onChange={(event) => {
                        const priceOptions = [...form.price_options];
                        priceOptions[index] = { ...option, price: Number(event.target.value) };
                        setForm({ ...form, price_options: priceOptions });
                      }}
                      className="min-w-0 rounded-lg border border-[#E4D6C0] px-3 py-2 text-sm outline-none focus:border-[#C28B38]"
                      placeholder="Price"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${option.label || "variation"}`}
                      onClick={() =>
                        setForm({
                          ...form,
                          price_options: form.price_options.filter((_, optionIndex) => optionIndex !== index),
                        })
                      }
                      className="flex items-center justify-center rounded-lg bg-red-50 text-red-700"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-[#3B2716]">Serving Details</span>
            <input
              value={form.serving_note}
              onChange={(e) => setForm({ ...form, serving_note: e.target.value })}
              className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
              placeholder="Per order or Serves 5–7 pax"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-[#3B2716]">Package / Bilao Inclusions</span>
            <textarea
              value={form.inclusions}
              onChange={(e) => setForm({ ...form, inclusions: e.target.value })}
              rows={4}
              className="mt-2 w-full resize-y rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
              placeholder={"One item per line:\n1 Small Bilao\n1 Bulalo\n2 Platter Rice"}
            />
          </label>

          <div>
            <span className="text-sm font-semibold text-[#3B2716]">
              Food Image
            </span>

            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#C28B38]/60 bg-white px-4 py-6 text-center transition hover:bg-[#F7F0E4]">
              {imagePreview ? (
                <div className="relative h-44 w-full overflow-hidden rounded-xl">
                  <Image
                    src={imagePreview}
                    alt="Menu item preview"
                    fill
                    className="object-cover"
                    sizes="400px"
                    unoptimized
                  />
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-[#3B2716]">
                    Click to upload image
                  </p>
                  <p className="mt-1 text-xs text-[#6F675E]">
                    JPG, PNG, or WebP recommended
                  </p>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {form.image_url && !imageFile && (
              <p className="mt-2 break-all text-xs text-[#6F675E]">
                Current image: {form.image_url}
              </p>
            )}
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-[#3B2716]">
              Display Order
            </span>
            <input
              type="number"
              value={form.display_order}
              onChange={(e) =>
                setForm({ ...form, display_order: e.target.value })
              }
              className="mt-2 w-full rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm outline-none focus:border-[#C28B38]"
              placeholder="1"
            />
          </label>

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm font-semibold text-[#3B2716]">
              <input
                type="checkbox"
                checked={form.is_best_seller}
                onChange={(e) =>
                  setForm({ ...form, is_best_seller: e.target.checked })
                }
              />
              Best Seller
            </label>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#E4D6C0] bg-white px-4 py-3 text-sm font-semibold text-[#3B2716]">
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) =>
                  setForm({ ...form, is_available: e.target.checked })
                }
              />
              Available
            </label>
          </div>

          {message && (
            <div className="rounded-xl border border-[#E4D6C0] bg-[#F7F0E4] px-4 py-3 text-sm text-[#3B2716]">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#C28B38] px-5 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#B47E2F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />
            {isUploading
              ? "Uploading image..."
              : isSaving
              ? "Saving..."
              : isEditing
              ? "Save Changes"
              : "Add Dish"}
          </button>
        </div>
      </form>

      <div className="rounded-3xl border border-[#E4D6C0] bg-[#FBF7EF] p-6 shadow-[0_18px_45px_rgba(59,39,22,0.08)] lg:sticky lg:top-8 lg:flex lg:max-h-[calc(100vh-4rem)] lg:flex-col lg:overflow-hidden">
        <div className="mb-5 shrink-0">
          <h2 className="text-3xl font-semibold text-[#3B2716]">
            Menu Items
          </h2>
          <p className="mt-1 text-sm text-[#6F675E]">
            Best sellers appear on the homepage. Unavailable items are hidden
            from customers.
          </p>
          <label className="mt-4 flex items-center gap-3 rounded-xl border border-[#D7C6A8] bg-white px-4 py-3 text-[#8B7A65] focus-within:border-[#C28B38] focus-within:ring-2 focus-within:ring-[#C28B38]/15">
            <Search size={18} className="shrink-0" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by dish or category..."
              className="min-w-0 flex-1 bg-transparent text-sm text-[#3B2716] outline-none placeholder:text-[#9A8B7A]"
            />
            <span className="shrink-0 text-xs font-semibold text-[#9A8B7A]">
              {filteredItems.length}/{items.length}
            </span>
          </label>
        </div>

        <div className="space-y-4 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 rounded-2xl border border-[#E4D6C0] bg-white p-4 md:grid-cols-[96px_minmax(0,1fr)]"
              >
                <div className="relative h-24 overflow-hidden rounded-xl bg-[#EFE3D1]">
                  <Image
                    src={item.image_url || "/images/food-placeholder.webp"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized={
                      item.image_url?.startsWith("http") ||
                      item.image_url?.startsWith("blob:")
                    }
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="line-clamp-2 min-w-0 break-words font-serif text-xl font-semibold leading-tight text-[#3B2716]">
                      {item.name}
                    </h3>

                    {item.is_best_seller && (
                      <span className="rounded-full bg-[#C28B38]/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#A46F22]">
                        Best Seller
                      </span>
                    )}

                    {!item.is_available && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-700">
                        Hidden
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm font-semibold text-[#C28B38]">
                    {item.category}
                    {(item.price !== null || item.price_options?.length > 0) && " • "}
                    {item.price_options?.length > 0
                      ? `From ₱${Math.min(...item.price_options.map((option) => Number(option.price))).toFixed(2)}`
                      : item.price !== null
                        ? `₱${Number(item.price).toFixed(2)}`
                        : ""}
                  </p>

                  {item.serving_note && (
                    <p className="mt-1 text-xs font-semibold text-[#2F4530]">
                      {item.serving_note}
                    </p>
                  )}

                  {item.price_options?.length > 0 && (
                    <p className="mt-1 line-clamp-2 text-xs text-[#6F675E]">
                      Options: {item.price_options
                        .map((option) => `${option.label} ₱${Number(option.price).toFixed(2)}`)
                        .join(" • ")}
                    </p>
                  )}

                  {item.inclusions && (
                    <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-[#6F675E]">
                      Includes: {item.inclusions}
                    </p>
                  )}

                  {item.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6F675E]">
                      {item.description}
                    </p>
                  )}

                  <p className="mt-2 text-xs uppercase tracking-wide text-[#9A8B7A]">
                    Display Order: {item.display_order}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:col-span-2 md:justify-end md:border-t md:border-[#EFE3D1] md:pt-3">
                  <button
                    type="button"
                    onClick={() => editItem(item)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E4D6C0] px-4 py-2 text-sm font-semibold text-[#3B2716] transition hover:bg-[#F7F0E4]"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleBestSeller(item)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E4D6C0] px-4 py-2 text-sm font-semibold text-[#3B2716] transition hover:bg-[#F7F0E4]"
                  >
                    {item.is_best_seller ? "Unmark" : "Best Seller"}
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleAvailability(item)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#E4D6C0] px-4 py-2 text-sm font-semibold text-[#3B2716] transition hover:bg-[#F7F0E4]"
                  >
                    {item.is_available ? "Hide" : "Show"}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-[#D7C6A8] bg-[#F7F0E4] p-8 text-center">
              <h3 className="text-2xl font-semibold text-[#3B2716]">
                {items.length > 0 ? "No matching menu items" : "No menu items yet"}
              </h3>
              <p className="mt-2 text-sm text-[#6F675E]">
                {items.length > 0
                  ? "Try a different dish name or category."
                  : "Add your first dish using the form on the left."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
