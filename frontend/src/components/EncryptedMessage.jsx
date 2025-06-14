import { useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { MoreVertical, Pencil, Trash } from 'lucide-react';

const EncryptedMessage = ({ message }) => {
    const [password, setPassword] = useState('');
    const [decryptedContent, setDecryptedContent] = useState(null);
    const [decryptedImage, setDecryptedImage] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const { decryptMessage, editMessage, deleteMessage } = useChatStore();
    const { authUser } = useAuthStore();

    const handleDecrypt = async () => {
        if (!password) {
            toast.error('Please enter a password');
            return;
        }
        
        setIsDecrypting(true);
        try {
            const res = await decryptMessage(message._id, password);
            if (res.data.success) {
                setDecryptedContent(res.data.data.content);
                setDecryptedImage(res.data.data.image || res.data.data.attachments?.[0]?.url);
                setEditedContent(res.data.data.content);
                toast.success('Message decrypted successfully');
            } else {
                toast.error(res.data.message || 'Failed to decrypt message');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to decrypt message');
        } finally {
            setIsDecrypting(false);
        }
    };

    const handleEdit = async () => {
        try {
            await editMessage(message._id, editedContent);
            setDecryptedContent(editedContent);
            setIsEditing(false);
            toast.success('Message updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update message');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this message?')) {
            try {
                await deleteMessage(message._id);
                toast.success('Message deleted successfully');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete message');
            }
        }
    };

    const isMessageOwner = message.sender === authUser._id;

    // If message is decrypted, show decrypted content
    if (decryptedContent || decryptedImage) {
        return (
            <div className="flex flex-col gap-2 relative group">
                <div className="flex items-start gap-2">
                    {isEditing ? (
                        <div className="flex-1">
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="textarea textarea-bordered w-full"
                                rows={3}
                            />
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={handleEdit}
                                    className="btn btn-sm btn-primary"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="btn btn-sm btn-ghost"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1">
                            {decryptedContent && (
                                <p className="text-sm">{decryptedContent}</p>
                            )}
                            {decryptedImage && (
                                <img
                                    src={decryptedImage}
                                    alt="Decrypted"
                                    className="mt-2 rounded-lg max-w-sm"
                                />
                            )}
                            {isMessageOwner && (
                                <div className="relative mt-2">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="btn btn-ghost btn-sm"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    {showMenu && (
                                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                            <div className="py-1">
                                                <button
                                                    onClick={() => {
                                                        setIsEditing(true);
                                                        setShowMenu(false);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                                >
                                                    <Pencil size={16} />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleDelete();
                                                        setShowMenu(false);
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                                                >
                                                    <Trash size={16} />
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // If user is the sender, show encrypted message placeholder
    if (isMessageOwner) {
        return (
            <div className="flex flex-col gap-2 relative group">
                <div className="flex items-start gap-2">
                    <div className="flex-1">
                        <p className="text-sm text-gray-500">[Encrypted Message]</p>
                        {message.image && (
                            <p className="text-sm text-gray-500 mt-2">[Encrypted Image]</p>
                        )}
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="btn btn-ghost btn-sm"
                        >
                            <MoreVertical size={16} />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setIsEditing(true);
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                    >
                                        <Pencil size={16} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleDelete();
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                                    >
                                        <Trash size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // If user is the receiver and message is not decrypted yet
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <input
                    type="password"
                    placeholder="Enter password to decrypt"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input input-bordered input-sm w-full"
                />
                <button
                    onClick={handleDecrypt}
                    disabled={isDecrypting}
                    className="btn btn-primary btn-sm"
                >
                    {isDecrypting ? 'Decrypting...' : 'Decrypt'}
                </button>
            </div>
        </div>
    );
};

export default EncryptedMessage; 