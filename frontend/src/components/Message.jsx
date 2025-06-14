import { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { decryptMessage } from '../lib/api';
import TranslateButton from './TranslateButton';
import { translateMessage } from '../lib/translation';
import toast from 'react-hot-toast';
import { Loader2, Pencil, Trash, MoreVertical } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';

const Message = ({ message }) => {
    const [decryptedContent, setDecryptedContent] = useState(null);
    const [translatedContent, setTranslatedContent] = useState(null);
    const [currentLang, setCurrentLang] = useState(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showActions, setShowActions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const { user } = useAuthContext();
    const { authUser } = useAuthStore();
    const { editMessage, deleteMessage } = useChatStore();
    const messageRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (messageRef.current && !messageRef.current.contains(event.target)) {
                setShowActions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDecrypt = async () => {
        try {
            const response = await decryptMessage(message._id, password);
            if (response.success) {
                setDecryptedContent(response.data.content);
                setShowPasswordModal(false);
                setPassword('');
                setError('');
            }
        } catch (error) {
            setError('Invalid password');
        }
    };

    const handleTranslate = async (targetLang) => {
        if (isTranslating) return;
        
        setIsTranslating(true);
        try {
            const contentToTranslate = decryptedContent || message.content;
            if (!contentToTranslate) {
                toast.error('No content to translate');
                return;
            }

            const response = await translateMessage(contentToTranslate, targetLang);
            if (response.success) {
                setTranslatedContent(response.translatedText);
                setCurrentLang(targetLang);
                toast.success('Message translated successfully');
            } else {
                throw new Error(response.error || 'Translation failed');
            }
        } catch (error) {
            console.error('Translation error:', error);
            toast.error(error.message || 'Failed to translate message');
        } finally {
            setIsTranslating(false);
        }
    };

    const resetTranslation = () => {
        setTranslatedContent(null);
        setCurrentLang(null);
    };

    const handleEdit = async () => {
        if (!isOwnMessage) {
            toast.error('You can only edit your own messages');
            return;
        }

        try {
            await editMessage(message._id, editedContent);
            setDecryptedContent(editedContent);
            setIsEditing(false);
            setShowActions(false);
            toast.success('Message updated successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update message');
        }
    };

    const handleDelete = async () => {
        if (!isOwnMessage) {
            toast.error('You can only delete your own messages');
            return;
        }

        if (window.confirm('Are you sure you want to delete this message?')) {
            try {
                await deleteMessage(message._id);
                setShowActions(false);
                toast.success('Message deleted successfully');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete message');
            }
        }
    };

    const isOwnMessage = message.sender === authUser._id;

    if (message.isEncrypted && !decryptedContent) {
        return (
            <div 
                ref={messageRef}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 items-start gap-2`}
            >
                <div className={`max-w-[70%] ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg p-3 relative`}>
                    <div>
                        <p>🔒 Encrypted Message</p>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="mt-2 text-sm underline"
                        >
                            Decrypt Message
                        </button>
                    </div>
                </div>
                <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                    title="Message options"
                >
                    <MoreVertical size={16} className="text-gray-600" />
                </button>

                {showPasswordModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Enter Password</h3>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 border rounded mb-4"
                                placeholder="Enter password"
                            />
                            {error && <p className="text-red-500 mb-4">{error}</p>}
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPassword('');
                                        setError('');
                                    }}
                                    className="btn btn-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDecrypt}
                                    className="btn btn-sm btn-primary"
                                >
                                    Decrypt
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div 
            ref={messageRef}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 items-start gap-2`}
        >
            <div className={`max-w-[70%] ${isOwnMessage ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'} rounded-lg p-3 relative`}>
                <div>
                    {isEditing ? (
                        <div className="flex flex-col gap-2">
                            <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full p-2 border rounded text-black"
                                rows={3}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEdit}
                                    className="btn btn-sm btn-primary"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditedContent('');
                                    }}
                                    className="btn btn-sm btn-ghost"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="relative">
                                <p>{translatedContent || decryptedContent || message.content}</p>
                                {isTranslating && (
                                    <div className="absolute right-0 top-0">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                )}
                            </div>
                            {currentLang && (
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs italic">(Translated)</p>
                                    <button
                                        onClick={resetTranslation}
                                        className="text-xs hover:underline"
                                    >
                                        Show original
                                    </button>
                                </div>
                            )}
                            {message.isEdited && (
                                <span className="text-xs italic">(edited)</span>
                            )}
                        </>
                    )}
                </div>
                {!isTranslating && !isEditing && (
                    <div className="flex justify-end mt-2">
                        <TranslateButton onTranslate={handleTranslate} />
                    </div>
                )}
            </div>
            <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                title="Message options"
            >
                <MoreVertical size={16} className="text-gray-600" />
            </button>
            {showActions && !isEditing && (
                <div className="absolute -top-10 right-0 flex gap-2 bg-white rounded-lg shadow-lg p-2 z-10">
                    <button
                        onClick={() => {
                            if (!isOwnMessage) {
                                toast.error('You can only edit your own messages');
                                return;
                            }
                            setIsEditing(true);
                            setEditedContent(decryptedContent || message.content);
                        }}
                        className={`btn btn-sm btn-ghost ${!isOwnMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isOwnMessage ? "Edit message" : "You can only edit your own messages"}
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        onClick={handleDelete}
                        className={`btn btn-sm btn-ghost text-red-500 ${!isOwnMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isOwnMessage ? "Delete message" : "You can only delete your own messages"}
                    >
                        <Trash size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Message; 