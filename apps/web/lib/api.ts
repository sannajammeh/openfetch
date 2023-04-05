import { Fetcher } from "openapi-typescript-fetch";
import { paths } from "../petstore";

const fetcher = Fetcher.for<paths>();

fetcher.path("/pet/{petId}").method("get").create();
