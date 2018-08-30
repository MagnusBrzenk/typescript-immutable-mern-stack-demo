import { getImmutableGenerator, getImType } from "__METATYPING"; //DO NOT REMOVE
import { CONTACTFEED } from "./CONTACTFEED";
import { EXPANDEDCONTACT } from "./EXPANDEDCONTACT";
import { FRONTENDFILTERS } from "./FRONTENDFILTERS";
import { SIMPLEAUTH } from "./SIMPLEAUTH";
import { ROUTERSTATE } from "./ROUTERSTATE";

/**
 * Note: These types are to be applied to the RootState object when creating root reducer; it combines our customized branches of the state tree with the router state
 * The rootState object is not a typical structure built from a POJO, it is created via combineReducers
 */
export namespace ROOTSTATE {
    export interface Interface {
        contactFeed: CONTACTFEED.Interface;
        frontendFilters: FRONTENDFILTERS.Interface;
        expandedContact: EXPANDEDCONTACT.Interface;
        simpleAuth: SIMPLEAUTH.Interface;
        router: ROUTERSTATE.Interface;
    }

    export const Default: Readonly<Interface> = {
        contactFeed: CONTACTFEED.Default,
        frontendFilters: FRONTENDFILTERS.Default,
        expandedContact: EXPANDEDCONTACT.Default,
        simpleAuth: SIMPLEAUTH.Default,
        router: ROUTERSTATE.Default
    };

    /* DO NOT EDIT/REMOVE */
    export const genIm = getImmutableGenerator(Default);
    export type ImType = getImType<Interface>;
    export type ImTypes = getImType<Interface[]>;
}
