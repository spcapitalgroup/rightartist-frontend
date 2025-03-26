import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

interface Design {
  id: string;
  designerId: string;
  shopId: string;
  postId: string;
  commentId: string;
  stage: "initial_sketch" | "revision_1" | "revision_2" | "revision_3" | "final_draft" | "final_design";
  images: string[];
  status: "pending" | "purchased";
  price: number;
  createdAt: string;
  updatedAt: string;
  designer: { id: string; username: string };
  shop: { id: string; username: string };
  Post: { id: string; title: string };
  comment: { id: string; content: string };
}

const DesignsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "purchased" | "sold">("pending");
  const [pendingDesigns, setPendingDesigns] = useState<Design[]>([]);
  const [purchasedDesigns, setPurchasedDesigns] = useState<Design[]>([]);
  const [soldDesigns, setSoldDesigns] = useState<Design[]>([]);
  const [error, setError] = useState("");
  const [stageUpdate, setStageUpdate] = useState<{ [key: string]: { stage: string; images: File[] } }>({});

  const token = localStorage.getItem("authToken");
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : {};
  const userType = decoded.userType || "fan";

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        if (!token) {
          setError("Please log in to access designs");
          return;
        }

        // Fetch pending designs (for both shop and designer users)
        const pendingResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/designs/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPendingDesigns(pendingResponse.data.designs || []);

        // Fetch purchased designs (for shop users)
        if (userType === "shop") {
          const purchasedResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/designs/purchased`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPurchasedDesigns(purchasedResponse.data.designs || []);
        }

        // Fetch sold designs (for designer users)
        if (userType === "designer") {
          const soldResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/designs/sold`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSoldDesigns(soldResponse.data.designs || []);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load designs");
        console.error("❌ Fetch Designs Error:", err.response?.data || err.message);
      }
    };
    fetchDesigns();
  }, [token, userType]);

  const handleStageUpdate = async (designId: string) => {
    try {
      const { stage, images } = stageUpdate[designId] || {};
      if (!stage) return;

      const formData = new FormData();
      formData.append("stage", stage);
      if (images && images.length > 0) {
        images.forEach((image) => formData.append("images", image));
      }

      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/designs/${designId}/stage`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setPendingDesigns((prev) =>
        prev.map((design) => (design.id === designId ? response.data.data : design))
      );
      setStageUpdate((prev) => ({ ...prev, [designId]: { stage: "", images: [] } }));
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update stage");
      console.error("❌ Update Stage Error:", err.response?.data || err.message);
    }
  };

  const handlePurchase = async (designId: string) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/designs/${designId}/purchase`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPendingDesigns((prev) => prev.filter((design) => design.id !== designId));
      setPurchasedDesigns((prev) => [...prev, response.data.data]);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to purchase design");
      console.error("❌ Purchase Design Error:", err.response?.data || err.message);
    }
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
      >
        <div className="max-w-4xl mx-auto text-tattoo-red">{error}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-20 pb-8 px-4 bg-tattoo-black"
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-tattoo-red mb-6">Designs</h1>
        <div className="flex mb-4">
          <button
            onClick={() => setActiveTab("pending")}
            className={`p-2 ${activeTab === "pending" ? "bg-tattoo-red text-tattoo-light" : "bg-tattoo-gray text-tattoo-light"} rounded-l-lg`}
          >
            Pending
          </button>
          {userType === "shop" && (
            <button
              onClick={() => setActiveTab("purchased")}
              className={`p-2 ${activeTab === "purchased" ? "bg-tattoo-red text-tattoo-light" : "bg-tattoo-gray text-tattoo-light"} rounded-r-lg`}
            >
              Purchased
            </button>
          )}
          {userType === "designer" && (
            <button
              onClick={() => setActiveTab("sold")}
              className={`p-2 ${activeTab === "sold" ? "bg-tattoo-red text-tattoo-light" : "bg-tattoo-gray text-tattoo-light"} rounded-r-lg`}
            >
              Sold
            </button>
          )}
        </div>
        <div className="space-y-4">
          {activeTab === "pending" ? (
            pendingDesigns.length > 0 ? (
              pendingDesigns.map((design) => (
                <motion.div
                  key={design.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-tattoo-gray/20 p-4 rounded-lg shadow-lg border border-tattoo-red/30"
                >
                  <h2 className="text-xl font-bold text-tattoo-light">
                    {design.Post ? design.Post.title : "Untitled Post"}
                  </h2>
                  <p className="text-tattoo-gray">Designer: {design.designer.username}</p>
                  <p className="text-tattoo-gray">Shop: {design.shop.username}</p>
                  <p className="text-tattoo-gray">Price: ${design.price.toFixed(2)}</p>
                  <p className="text-tattoo-gray">Stage: {design.stage.replace("_", " ").toUpperCase()}</p>
                  {design.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {design.images.map((image, index) => (
                        <img
                          key={index}
                          src={`http://localhost:3000/uploads/${image}`}
                          alt={`Design ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            console.log(`Failed to load image: ${image}`);
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-tattoo-gray text-sm mt-1">
                    Created: {formatDistanceToNow(new Date(design.createdAt), { addSuffix: true })}
                  </p>
                  {userType === "designer" && (
                    <div className="mt-2">
                      <select
                        value={stageUpdate[design.id]?.stage || ""}
                        onChange={(e) =>
                          setStageUpdate({
                            ...stageUpdate,
                            [design.id]: { ...stageUpdate[design.id], stage: e.target.value },
                          })
                        }
                        className="p-2 bg-tattoo-black border border-tattoo-gray rounded-lg text-tattoo-light"
                      >
                        <option value="">Select Stage</option>
                        <option value="initial_sketch">Initial Sketch</option>
                        <option value="revision_1">Revision 1</option>
                        <option value="revision_2">Revision 2</option>
                        <option value="revision_3">Revision 3</option>
                        <option value="final_draft">Final Draft</option>
                        <option value="final_design">Final Design</option>
                      </select>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={(e) => {
                          if (e.target.files) {
                            setStageUpdate({
                              ...stageUpdate,
                              [design.id]: {
                                ...stageUpdate[design.id],
                                images: Array.from(e.target.files).slice(0, 5),
                              },
                            });
                          }
                        }}
                        className="mt-2 text-tattoo-light"
                      />
                      <button
                        onClick={() => handleStageUpdate(design.id)}
                        className="mt-2 bg-tattoo-red text-tattoo-light px-4 py-1 rounded-lg hover:bg-tattoo-red/80"
                      >
                        Update Stage
                      </button>
                    </div>
                  )}
                  {userType === "shop" && design.stage === "final_design" && (
                    <button
                      onClick={() => handlePurchase(design.id)}
                      className="mt-2 bg-tattoo-red text-tattoo-light px-4 py-1 rounded-lg hover:bg-tattoo-red/80"
                    >
                      Purchase Design
                    </button>
                  )}
                </motion.div>
              ))
            ) : (
              <p className="text-tattoo-gray">No pending designs.</p>
            )
          ) : activeTab === "purchased" ? (
            purchasedDesigns.length > 0 ? (
              purchasedDesigns.map((design) => (
                <motion.div
                  key={design.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-tattoo-gray/20 p-4 rounded-lg shadow-lg border border-tattoo-red/30"
                >
                  <h2 className="text-xl font-bold text-tattoo-light">
                    {design.Post ? design.Post.title : "Untitled Post"}
                  </h2>
                  <p className="text-tattoo-gray">Designer: {design.designer.username}</p>
                  <p className="text-tattoo-gray">Price: ${design.price.toFixed(2)}</p>
                  {design.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {design.images.map((image, index) => (
                        <img
                          key={index}
                          src={`http://localhost:3000/uploads/${image}`}
                          alt={`Design ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            console.log(`Failed to load image: ${image}`);
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-tattoo-gray text-sm mt-1">
                    Purchased: {formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true })}
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="text-tattoo-gray">No purchased designs.</p>
            )
          ) : activeTab === "sold" ? (
            soldDesigns.length > 0 ? (
              soldDesigns.map((design) => (
                <motion.div
                  key={design.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-tattoo-gray/20 p-4 rounded-lg shadow-lg border border-tattoo-red/30"
                >
                  <h2 className="text-xl font-bold text-tattoo-light">
                    {design.Post ? design.Post.title : "Untitled Post"}
                  </h2>
                  <p className="text-tattoo-gray">Shop: {design.shop.username}</p>
                  <p className="text-tattoo-gray">Price: ${design.price.toFixed(2)}</p>
                  {design.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {design.images.map((image, index) => (
                        <img
                          key={index}
                          src={`http://localhost:3000/uploads/${image}`}
                          alt={`Design ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            console.log(`Failed to load image: ${image}`);
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <p className="text-tattoo-gray text-sm mt-1">
                    Sold: {formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true })}
                  </p>
                </motion.div>
              ))
            ) : (
              <p className="text-tattoo-gray">No sold designs.</p>
            )
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

export default DesignsPage;