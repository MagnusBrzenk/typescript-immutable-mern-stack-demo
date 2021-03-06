import { getMongoDB } from "./getMongoDB";
import { CONTACT } from "__MODELS";
import { provisionalNewContactId } from "__CONSTANTS";
import { ObjectId, BulkWriteOpResultObject } from "mongodb";
import { __debug } from "__FUNCTIONS/__debug";
const debug = __debug("PERSIST-CONTACTS");

/**
 * Receive, validate and upsert contacts to DB; return created/updated contacts
 * @param contacts
 */
export async function persistContacts(contacts: CONTACT.Interface[]): Promise<CONTACT.Interface[]> {
    //

    //Validate contacts; if _id is provisional then create a new _id string:
    const validatedContacts: CONTACT.Interface[] = CONTACT.validate(contacts).map(contact => ({
        ...contact,
        _id: contact._id === provisionalNewContactId ? new ObjectId().toHexString() : contact._id
    }));

    //Create array of bulk writes:
    const bulkWrites: any = validatedContacts.map(el => ({
        updateOne: {
            filter: { _id: el._id },
            update: { $set: el },
            upsert: true
        }
    }));

    //Write to DB; if successful, return validatedContacts
    try {
        const db = await getMongoDB();
        const res: BulkWriteOpResultObject = await db.collection("contacts").bulkWrite(bulkWrites, { ordered: false });
        if (res.result.ok === 1) return validatedContacts;
    } catch (err) {
        debug(err);
    }
    return [];
}
